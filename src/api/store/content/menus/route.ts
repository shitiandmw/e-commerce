import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MENU_MODULE } from "../../../../modules/menu"
import MenuModuleService from "../../../../modules/menu/service"

interface BrandRecord {
  id: string
  name: string
  logo_url: string | null
  origin: string | null
}

interface MenuItemRecord {
  id: string
  label: string
  url: string | null
  icon_url: string | null
  sort_order: number
  is_enabled: boolean
  metadata: Record<string, unknown> | null
  parent_id: string | null
  children?: MenuItemRecord[]
  brands?: BrandRecord[]
}

function buildTree(items: MenuItemRecord[]): MenuItemRecord[] {
  const map = new Map<string, MenuItemRecord>()
  const roots: MenuItemRecord[] = []

  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }

  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortAndFilter = (nodes: MenuItemRecord[]): MenuItemRecord[] => {
    return nodes
      .filter((n) => n.is_enabled)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((n) => ({
        ...n,
        children: sortAndFilter(n.children || []),
      }))
  }

  return sortAndFilter(roots)
}

// Check if any menu item in the tree has item_type=brand
function hasBrandItems(items: MenuItemRecord[]): boolean {
  for (const item of items) {
    if (item.metadata?.item_type === "brand") return true
    if (item.children && hasBrandItems(item.children)) return true
  }
  return false
}

// Attach brand data to items with item_type=brand, filtered by brand_origin
function attachBrands(items: MenuItemRecord[], brands: BrandRecord[]): MenuItemRecord[] {
  return items.map((item) => {
    let itemBrands: BrandRecord[] | undefined
    if (item.metadata?.item_type === "brand") {
      const origin = item.metadata?.brand_origin as string | undefined
      itemBrands = origin
        ? brands.filter((b) => b.origin === origin)
        : brands
    }
    return {
      ...item,
      brands: itemBrands,
      children: item.children ? attachBrands(item.children, brands) : [],
    }
  })
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const key = req.query.key as string | undefined
  const locale = req.query.locale as string | undefined
  const query = req.scope.resolve("query")

  const filters: Record<string, any> = {}
  if (key) {
    filters.key = key
  }

  const { data: menus } = await query.graph(
    {
      entity: "menu",
      fields: ["id", "name", "key", "description"],
      filters,
    },
    { locale },
  )

  // For each menu, load items and build tree
  const menuService: MenuModuleService = req.scope.resolve(MENU_MODULE)
  const result = await Promise.all(
    (menus || []).map(async (menu: any) => {
      const fullMenu = await menuService.retrieveMenu(menu.id, {
        relations: ["items"],
      })
      const items = (fullMenu.items || []) as unknown as MenuItemRecord[]
      const tree = buildTree(items)

      // If any item has item_type=brand, load brands and attach
      let finalTree = tree
      if (hasBrandItems(tree)) {
        const { data: brands } = await query.graph(
          {
            entity: "brand",
            fields: ["id", "name", "logo_url", "origin"],
            pagination: { order: { name: "ASC" } },
          },
          { locale },
        )
        finalTree = attachBrands(tree, (brands || []) as unknown as BrandRecord[])
      }

      return {
        id: menu.id,
        name: menu.name,
        key: menu.key,
        description: menu.description,
        items: finalTree,
      }
    })
  )

  res.json({ menus: result })
}

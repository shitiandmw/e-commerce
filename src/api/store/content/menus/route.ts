import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MENU_MODULE } from "../../../../modules/menu"
import MenuModuleService from "../../../../modules/menu/service"

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

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const key = req.query.key as string | undefined
  const query = req.scope.resolve("query")

  const filters: Record<string, any> = {}
  if (key) {
    filters.key = key
  }

  const { data: menus } = await query.graph({
    entity: "menu",
    fields: ["id", "name", "key", "description"],
    filters,
  })

  // For each menu, load items and build tree
  const menuService: MenuModuleService = req.scope.resolve(MENU_MODULE)
  const result = await Promise.all(
    (menus || []).map(async (menu: any) => {
      const fullMenu = await menuService.retrieveMenu(menu.id, {
        relations: ["items"],
      })
      const items = (fullMenu.items || []) as unknown as MenuItemRecord[]
      const tree = buildTree(items)
      return {
        id: menu.id,
        name: menu.name,
        key: menu.key,
        description: menu.description,
        items: tree,
      }
    })
  )

  res.json({ menus: result })
}

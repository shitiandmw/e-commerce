import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MENU_MODULE } from "../../../../modules/menu"
import MenuModuleService from "../../../../modules/menu/service"
import { updateMenuWorkflow } from "../../../../workflows/menu/update-menu"
import { deleteMenuWorkflow } from "../../../../workflows/menu/delete-menu"
import { PostAdminUpdateMenuType } from "../validators"

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

  // Initialize all items with empty children array
  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }

  // Build tree structure
  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children by sort_order
  const sortChildren = (nodes: MenuItemRecord[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order)
    for (const node of nodes) {
      if (node.children?.length) {
        sortChildren(node.children)
      }
    }
  }
  sortChildren(roots)

  return roots
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const menuService: MenuModuleService = req.scope.resolve(MENU_MODULE)

  const menu = await menuService.retrieveMenu(id, {
    relations: ["items"],
  })

  if (!menu) {
    res.status(404).json({ message: "Menu not found" })
    return
  }

  const items = (menu.items || []) as unknown as MenuItemRecord[]
  const tree = buildTree(items)

  res.json({
    menu: {
      ...menu,
      items: tree,
    },
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateMenuType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateMenuWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ menu: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteMenuWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "menu", deleted: true })
}

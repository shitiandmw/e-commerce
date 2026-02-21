import { fetchContent } from "@/lib/medusa"

/* ─── types matching the Menu API response ─── */

export interface MenuBrand {
  id: string
  name: string
  logo_url: string | null
  origin: string | null
}

export interface MenuItem {
  id: string
  label: string
  url: string | null
  icon_url: string | null
  sort_order: number
  is_enabled: boolean
  metadata: Record<string, unknown> | null
  parent_id: string | null
  children: MenuItem[]
  brands?: MenuBrand[]
}

export interface MenuData {
  id: string
  name: string
  key: string
  description: string | null
  items: MenuItem[]
}

interface MenuApiResponse {
  menus: MenuData[]
}

/* ─── fetch ─── */

export async function getMainNav(): Promise<MenuItem[]> {
  try {
    const data = await fetchContent<MenuApiResponse>("/store/content/menus", {
      key: "main-nav",
    })
    const menu = data?.menus?.[0]
    return menu?.items ?? []
  } catch {
    return []
  }
}

import Link from "next/link"
import { sdk } from "@/lib/medusa"
import HeaderClient from "./HeaderClient"

type MenuItem = {
  id: string
  label: string
  url: string
  sort_order: number
  children: MenuItem[]
}

type Menu = {
  id: string
  name: string
  key: string
  items: MenuItem[]
}

async function getMainMenu(): Promise<MenuItem[]> {
  try {
    const data = await sdk.client.fetch<{ menus: Menu[] }>(
      "/store/content/menus?key=main",
      { method: "GET" }
    )
    return data.menus?.[0]?.items || []
  } catch {
    return []
  }
}

export default async function Header() {
  const menuItems = await getMainMenu()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-wider text-gold">
          TIMECIGAR
        </Link>
        <HeaderClient menuItems={menuItems} />
      </div>
    </header>
  )
}

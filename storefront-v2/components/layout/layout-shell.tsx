"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/layout/header"
import { SiteFooter } from "@/components/layout/footer"
import AuthGuard from "@/components/auth-guard"
import { useCart } from "@/lib/cart-store"
import type { MenuItem, MenuData } from "@/lib/data/menu"

export function LayoutShell({
  children,
  navItems,
  footerMenu,
}: {
  children: React.ReactNode
  navItems: MenuItem[]
  footerMenu: MenuData | null
}) {
  const pathname = usePathname()
  const isCheckout = pathname.startsWith("/checkout")
  const initCart = useCart((s) => s.initCart)

  useEffect(() => {
    initCart()
  }, [initCart])

  if (isCheckout) {
    return <AuthGuard>{children}</AuthGuard>
  }

  return (
    <>
      <SiteHeader navItems={navItems} />
      <main className="min-h-screen">
        <AuthGuard>{children}</AuthGuard>
      </main>
      <SiteFooter menu={footerMenu} />
    </>
  )
}

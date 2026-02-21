"use client"

import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/layout/header"
import { SiteFooter } from "@/components/layout/footer"
import AuthGuard from "@/components/auth-guard"
import type { MenuItem } from "@/lib/data/menu"

export function LayoutShell({ children, navItems }: { children: React.ReactNode; navItems: MenuItem[] }) {
  const pathname = usePathname()
  const isCheckout = pathname.startsWith("/checkout")

  if (isCheckout) {
    return <AuthGuard>{children}</AuthGuard>
  }

  return (
    <>
      <SiteHeader navItems={navItems} />
      <main className="min-h-screen">
        <AuthGuard>{children}</AuthGuard>
      </main>
      <SiteFooter />
    </>
  )
}

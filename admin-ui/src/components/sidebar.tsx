"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { logout } from "@/lib/auth"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Store,
  Tag,
  Bookmark,
  Warehouse,
  ImageIcon,
  BarChart3,
  Percent,
  Truck,
  BookOpen,
} from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"

const navigation = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "products", href: "/products", icon: Package },
  { key: "brands", href: "/brands", icon: Tag },
  { key: "tags", href: "/tags", icon: Bookmark },
  { key: "inventory", href: "/inventory", icon: Warehouse },
  { key: "orders", href: "/orders", icon: ShoppingCart },
  { key: "promotions", href: "/promotions", icon: Percent },
  { key: "shipping", href: "/shipping", icon: Truck },
  { key: "customers", href: "/customers", icon: Users },
  { key: "pages", href: "/pages", icon: BookOpen },
  { key: "media", href: "/media", icon: ImageIcon },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
  { key: "settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("sidebar")

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Store className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">{t("brand")}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          )
        })}
      </nav>

      {/* Language Switcher & Logout */}
      <div className="border-t px-3 py-4 space-y-1">
        <LanguageSwitcher />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </button>
      </div>
    </div>
  )
}

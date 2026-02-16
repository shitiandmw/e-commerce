"use client"

import { useState, useEffect } from "react"
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
  LayoutGrid,
  Warehouse,
  ImageIcon,
  BarChart3,
  Percent,
  Truck,
  BookOpen,
  Megaphone,
  Maximize2,
  Layers,
  FileText,
  List,
  ChevronDown,
} from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"

type NavItem = {
  key: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

type NavGroup = {
  key: string
  icon: React.ComponentType<{ className?: string }>
  children: NavItem[]
}

type NavEntry = NavItem | NavGroup

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry
}

const navigation: NavEntry[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    key: "catalog",
    icon: Package,
    children: [
      { key: "products", href: "/products", icon: Package },
      { key: "brands", href: "/brands", icon: Tag },
      { key: "tags", href: "/tags", icon: Bookmark },
      { key: "collections", href: "/collections", icon: LayoutGrid },
      { key: "inventory", href: "/inventory", icon: Warehouse },
    ],
  },
  {
    key: "sales",
    icon: ShoppingCart,
    children: [
      { key: "orders", href: "/orders", icon: ShoppingCart },
      { key: "customers", href: "/customers", icon: Users },
      { key: "promotions", href: "/promotions", icon: Percent },
      { key: "shipping", href: "/shipping", icon: Truck },
    ],
  },
  {
    key: "content",
    icon: FileText,
    children: [
      { key: "articles", href: "/articles", icon: FileText },
      { key: "pages", href: "/pages", icon: BookOpen },
      { key: "banners", href: "/banners", icon: Layers },
      { key: "media", href: "/media", icon: ImageIcon },
    ],
  },
  {
    key: "site",
    icon: Megaphone,
    children: [
      { key: "menus", href: "/menus", icon: List },
      { key: "announcements", href: "/announcements", icon: Megaphone },
      { key: "popups", href: "/popups", icon: Maximize2 },
    ],
  },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
  { key: "settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("sidebar")

  // Auto-expand groups that contain the active route
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const entry of navigation) {
      if (isGroup(entry) && entry.children.some((c) => pathname.startsWith(c.href))) {
        initial.add(entry.key)
      }
    }
    return initial
  })

  // Keep groups in sync when route changes
  useEffect(() => {
    for (const entry of navigation) {
      if (isGroup(entry) && entry.children.some((c) => pathname.startsWith(c.href))) {
        setOpenGroups((prev) => {
          if (prev.has(entry.key)) return prev
          return new Set(prev).add(entry.key)
        })
      }
    }
  }, [pathname])

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

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
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navigation.map((entry) => {
            if (!isGroup(entry)) {
              const isActive = pathname.startsWith(entry.href)
              return (
                <Link
                  key={entry.key}
                  href={entry.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <entry.icon className="h-4 w-4" />
                  {t(entry.key)}
                </Link>
              )
            }

            const isOpen = openGroups.has(entry.key)
            const hasActive = entry.children.some((c) => pathname.startsWith(c.href))

            return (
              <div key={entry.key}>
                <button
                  onClick={() => toggleGroup(entry.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    hasActive
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <entry.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{t(entry.key)}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                <div className="ml-4 space-y-0.5 border-l pl-3 pt-1">
                    {entry.children.map((child) => {
                      const isActive = pathname.startsWith(child.href)
                      return (
                        <Link
                          key={child.key}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <child.icon className="h-3.5 w-3.5" />
                          {t(child.key)}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
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

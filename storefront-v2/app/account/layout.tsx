"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { getCustomer, isLoggedIn, logout } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { User, MapPin, Package, LogOut } from "lucide-react"

const NAV_ITEMS = [
  { path: "/account", label: "账户概览", icon: User },
  { path: "/account/profile", label: "个人资料", icon: User },
  { path: "/account/addresses", label: "收货地址", icon: MapPin },
  { path: "/account/orders", label: "订单历史", icon: Package },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [customer, setCustomer] = useState<{ first_name?: string; last_name?: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCustomer = useCallback(async () => {
    if (!isLoggedIn()) return
    const c = await getCustomer()
    setCustomer(c)
    setLoading(false)
  }, [])

  useEffect(() => { loadCustomer() }, [loadCustomer])

  const handleLogout = async () => {
    await logout()
    router.replace("/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              {customer && (
                <div className="mb-4 border-b border-border pb-4">
                  <p className="font-semibold text-foreground">
                    {customer.last_name}{customer.first_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
              )}
              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.path
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-gold/10 text-gold font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </CardContent>
          </Card>
        </aside>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto md:hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.path
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-gold/10 text-gold font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

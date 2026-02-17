"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { getCustomer, isLoggedIn, logout } from "@/lib/auth"

const NAV_ITEMS = [
  { href: "/account", label: "账户概览" },
  { href: "/account/profile", label: "个人资料" },
  { href: "/account/addresses", label: "收货地址" },
  { href: "/account/orders", label: "订单历史" },
]

export default function AccountSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [customer, setCustomer] = useState<{ first_name?: string; last_name?: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCustomer = useCallback(async () => {
    if (!isLoggedIn()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    const c = await getCustomer()
    if (!c) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    setCustomer(c)
    setLoading(false)
  }, [pathname, router])

  useEffect(() => { loadCustomer() }, [loadCustomer])

  const handleLogout = async () => {
    await logout()
    router.replace("/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted">加载中...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <div className="mb-6">
            <p className="text-lg font-semibold text-foreground">
              {customer?.last_name}{customer?.first_name}
            </p>
            <p className="text-sm text-muted">{customer?.email}</p>
          </div>
          <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col md:gap-0">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-surface-light text-gold font-medium"
                      : "text-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <button
            onClick={handleLogout}
            className="mt-4 w-full rounded-md px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface hover:text-red-400"
          >
            退出登录
          </button>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

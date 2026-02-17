"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { getCustomer, isLoggedIn, logout } from "@/lib/auth"
import type { Locale } from "@/lib/i18n"

const NAV_ITEMS = [
  { path: "/account", labelKey: "account_overview" },
  { path: "/account/profile", labelKey: "profile" },
  { path: "/account/addresses", labelKey: "addresses" },
  { path: "/account/orders", labelKey: "order_history" },
]

const LABELS: Record<string, Record<string, string>> = {
  "zh-CN": { account_overview: "账户概览", profile: "个人资料", addresses: "收货地址", order_history: "订单历史", logout: "退出登录", loading: "加载中..." },
  "zh-TW": { account_overview: "帳戶概覽", profile: "個人資料", addresses: "收貨地址", order_history: "訂單歷史", logout: "登出", loading: "載入中..." },
  en: { account_overview: "Account Overview", profile: "Profile", addresses: "Addresses", order_history: "Order History", logout: "Logout", loading: "Loading..." },
}

export default function AccountSidebar({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const pathname = usePathname()
  const router = useRouter()
  const [customer, setCustomer] = useState<{ first_name?: string; last_name?: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const t = LABELS[locale] || LABELS["zh-CN"]

  const loadCustomer = useCallback(async () => {
    if (!isLoggedIn()) {
      router.replace(`/${locale}/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    const c = await getCustomer()
    if (!c) {
      router.replace(`/${locale}/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    setCustomer(c)
    setLoading(false)
  }, [pathname, router, locale])

  useEffect(() => { loadCustomer() }, [loadCustomer])

  const handleLogout = async () => {
    await logout()
    router.replace(`/${locale}/login`)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted">{t.loading}</div>
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
              const href = `/${locale}${item.path}`
              const active = pathname === href
              return (
                <Link
                  key={item.path}
                  href={href}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-surface-light text-gold font-medium"
                      : "text-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  {t[item.labelKey]}
                </Link>
              )
            })}
          </nav>
          <button
            onClick={handleLogout}
            className="mt-4 w-full rounded-md px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface hover:text-red-400"
          >
            {t.logout}
          </button>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

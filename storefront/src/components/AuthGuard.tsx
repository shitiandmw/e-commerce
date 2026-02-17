"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isLoggedIn } from "@/lib/auth"

const PROTECTED_PATHS = ["/checkout", "/account", "/orders"]

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Strip locale prefix to check protected paths
    const pathWithoutLocale = pathname.replace(/^\/(zh-CN|zh-TW|en)/, "") || "/"
    const locale = pathname.match(/^\/(zh-CN|zh-TW|en)/)?.[1] || "zh-CN"
    const needsAuth = PROTECTED_PATHS.some((p) => pathWithoutLocale.startsWith(p))
    if (needsAuth && !isLoggedIn()) {
      router.replace(`/${locale}/login?redirect=${encodeURIComponent(pathname)}`)
    } else {
      setChecked(true)
    }
  }, [pathname, router])

  if (!checked) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted">...</div>
      </div>
    )
  }

  return <>{children}</>
}

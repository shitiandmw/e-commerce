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
    const needsAuth = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
    if (needsAuth && !isLoggedIn()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    } else {
      setChecked(true)
    }
  }, [pathname, router])

  if (!checked) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted">加载中...</div>
      </div>
    )
  }

  return <>{children}</>
}

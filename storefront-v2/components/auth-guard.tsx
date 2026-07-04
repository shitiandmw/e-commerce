"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "@/i18n/navigation"
import { getCustomer, getToken } from "@/lib/auth"

const PROTECTED_PATHS = ["/checkout", "/account", "/orders"]
const PUBLIC_PATHS = ["/checkout/return", "/checkout/success"]

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    const needsAuth = !isPublicPath && PROTECTED_PATHS.some((p) => pathname.startsWith(p))

    async function syncAuth() {
      if (!needsAuth) {
        if (!cancelled) setChecked(true)
        return
      }

      if (!getToken()) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      const customer = await getCustomer()
      if (cancelled) return
      if (!customer) {
        if (!getToken()) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
          return
        }

        setChecked(true)
        return
      }

      setChecked(true)
    }

    setChecked(false)
    void syncAuth()

    const handleAuthChange = () => {
      if (needsAuth && !getToken()) {
        setChecked(false)
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      }
    }

    window.addEventListener("auth-change", handleAuthChange)
    return () => {
      cancelled = true
      window.removeEventListener("auth-change", handleAuthChange)
    }
  }, [pathname, router])

  if (!checked) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">...</div>
      </div>
    )
  }

  return <>{children}</>
}

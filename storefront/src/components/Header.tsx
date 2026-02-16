"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { isLoggedIn, logout } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function Header() {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  function handleLogout() {
    logout()
    setLoggedIn(false)
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-wider text-gold">
          TIMECIGAR
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/products" className="text-sm text-muted transition-colors hover:text-gold">
            全部商品
          </Link>
          <Link href="/brands" className="text-sm text-muted transition-colors hover:text-gold">
            品牌
          </Link>
          <Link href="/articles" className="text-sm text-muted transition-colors hover:text-gold">
            资讯
          </Link>
          <Link href="/about" className="text-sm text-muted transition-colors hover:text-gold">
            关于我们
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/cart" className="text-sm text-muted transition-colors hover:text-gold">
            购物车
          </Link>
          {loggedIn ? (
            <>
              <Link href="/account" className="text-sm text-muted transition-colors hover:text-gold">
                账户
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-muted transition-colors hover:text-gold"
              >
                退出
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm text-muted transition-colors hover:text-gold">
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

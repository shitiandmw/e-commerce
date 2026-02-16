import Link from "next/link"

export default function Header() {
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
          <Link href="/pages/about" className="text-sm text-muted transition-colors hover:text-gold">
            关于我们
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/search" className="text-muted transition-colors hover:text-gold" aria-label="搜索">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>
          <Link href="/cart" className="text-sm text-muted transition-colors hover:text-gold">
            购物车
          </Link>
          <Link href="/account" className="text-sm text-muted transition-colors hover:text-gold">
            账户
          </Link>
        </div>
      </div>
    </header>
  )
}

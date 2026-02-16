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
          <Link href="/about" className="text-sm text-muted transition-colors hover:text-gold">
            关于我们
          </Link>
        </nav>
        <div className="flex items-center gap-4">
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

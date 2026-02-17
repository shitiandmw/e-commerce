import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-6xl font-bold text-gold">404</h1>
      <h2 className="mb-4 text-2xl font-semibold text-foreground">
        页面未找到
      </h2>
      <p className="mb-8 max-w-md text-muted">
        抱歉，您访问的页面不存在或已被移除。
      </p>
      <Link
        href="/"
        className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light"
      >
        返回首页
      </Link>
    </div>
  )
}

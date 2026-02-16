import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold text-gold">TIMECIGAR</h3>
            <p className="text-sm text-muted">
              精选雪茄，品味生活。
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">购物指南</h4>
            <ul className="space-y-2">
              <li><Link href="/pages/shipping" className="text-sm text-muted hover:text-gold">配送说明</Link></li>
              <li><Link href="/pages/returns" className="text-sm text-muted hover:text-gold">退换政策</Link></li>
              <li><Link href="/pages/faq" className="text-sm text-muted hover:text-gold">常见问题</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">关于</h4>
            <ul className="space-y-2">
              <li><Link href="/pages/about" className="text-sm text-muted hover:text-gold">关于我们</Link></li>
              <li><Link href="/pages/terms" className="text-sm text-muted hover:text-gold">服务条款</Link></li>
              <li><Link href="/pages/privacy" className="text-sm text-muted hover:text-gold">隐私政策</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">联系我们</h4>
            <p className="text-sm text-muted">support@timecigar.com</p>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted">
          © {new Date().getFullYear()} TIMECIGAR. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

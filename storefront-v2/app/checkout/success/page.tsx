import Link from "next/link"
import { CheckCircle2, ArrowRight, Package } from "lucide-react"

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="size-20 flex items-center justify-center rounded-full bg-gold/10 mx-auto mb-8">
        <CheckCircle2 className="size-10 text-gold" />
      </div>

      <h1 className="text-2xl font-serif text-foreground mb-3">訂單已確認</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
        感謝您的購買！我們已收到您的訂單。
      </p>
      <p className="text-xs text-muted-foreground mb-8">
        訂單確認郵件已發送到您的電郵地址。
      </p>

      <div className="bg-card border border-border/30 p-6 mb-8 text-left">
        <div className="flex items-center gap-3 mb-4">
          <Package className="size-4 text-gold/60" />
          <span className="text-sm text-foreground">訂單詳情</span>
        </div>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-border/20">
            <span className="text-muted-foreground">訂單編號</span>
            <span className="text-foreground font-mono">TC-{Date.now().toString(36).toUpperCase()}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/20">
            <span className="text-muted-foreground">狀態</span>
            <span className="text-gold">處理中</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-muted-foreground">預計送達</span>
            <span className="text-foreground">7-14 個工作天</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-6 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors"
        >
          繼續購物
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          返回首頁
        </Link>
      </div>
    </div>
  )
}

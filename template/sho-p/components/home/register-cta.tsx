import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function RegisterCTA() {
  return (
    <section className="py-20 px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="relative border border-gold/20 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 px-8 py-16 text-center">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-gold/40" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-gold/40" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-gold/40" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-gold/40" />

          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Join Us</p>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground text-balance">
            立即加入 TIMECIGAR
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed">
            註冊成為會員，即可享受首單 9 折優惠、專屬積分回饋、新品搶先通知等多重禮遇。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#"
              className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide hover:bg-gold-dark transition-colors"
            >
              免費註冊 <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#"
              className="inline-flex items-center gap-2 border border-border text-foreground/70 px-8 py-3 text-sm tracking-wide hover:border-gold hover:text-gold transition-colors"
            >
              了解會員權益
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

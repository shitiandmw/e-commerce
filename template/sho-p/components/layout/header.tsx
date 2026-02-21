"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Search, User, ShoppingBag, Menu, ChevronDown, ChevronRight, X, Globe, Check } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  categories,
  promotionLinks,
  vipLinks,
  brandPromoLinks,
  cigarFeatureLinks,
  newArrivalLinks,
  accessorySubItems,
  type Category,
} from "@/lib/data/categories"
import { useCart, selectTotalItems } from "@/lib/cart-store"
import { cn } from "@/lib/utils"

/* ─── brand logo placeholder ─── */
function BrandLogo({ letter, size = "sm" }: { letter?: string; size?: "sm" | "md" }) {
  const dim = size === "md" ? "size-9" : "size-7"
  const text = size === "md" ? "text-[10px]" : "text-[8px]"
  return (
    <span
      className={cn(
        dim,
        "shrink-0 inline-flex items-center justify-center rounded bg-gold/10 border border-gold/20 text-gold font-bold uppercase",
        text
      )}
    >
      {letter ?? "?"}
    </span>
  )
}

/* ─── language options ─── */
const languages = [
  { code: "zh-Hant", label: "繁體中文", short: "繁中" },
  { code: "zh-Hans", label: "简体中文", short: "简中" },
  { code: "en", label: "English", short: "EN" },
]

/* ─── navigation structure ─── */
interface NavItem {
  label: string
  href: string
  megaKey?: string
  categorySlug?: string
}

const navItems: NavItem[] = [
  { label: "最新推廣", href: "#", megaKey: "promos" },
  { label: "古巴雪茄", href: "/category/cuban-cigars", megaKey: "brands", categorySlug: "cuban-cigars" },
  { label: "世界品牌", href: "/category/world-cigars", megaKey: "brands", categorySlug: "world-cigars" },
  { label: "古巴小雪茄", href: "/category/mini-cigars", megaKey: "brands", categorySlug: "mini-cigars" },
  { label: "煙斗煙絲", href: "/category/pipe-tobacco", megaKey: "brands", categorySlug: "pipe-tobacco" },
  { label: "雪茄配件", href: "/category/accessories", megaKey: "accessories" },
  { label: "茄時分享", href: "/articles", megaKey: "articles" },
]

/* ─── mega menu panels ─── */
function PromoColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="min-w-[170px]">
      <h4 className="text-gold text-xs font-semibold uppercase tracking-widest mb-3">{title}</h4>
      <ul className="flex flex-col gap-1.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-foreground/70 hover:text-gold transition-colors leading-relaxed">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PromoPanel() {
  return (
    <div className="flex gap-8 p-6 overflow-x-auto">
      <PromoColumn title="新年推廣" links={promotionLinks} />
      <PromoColumn title="VIP 尊享" links={vipLinks} />
      <PromoColumn title="品牌推薦" links={brandPromoLinks} />
      <PromoColumn title="精選專題" links={cigarFeatureLinks} />
      <PromoColumn title="新品 / 到貨" links={newArrivalLinks} />
    </div>
  )
}

function BrandPanel({ category }: { category: Category }) {
  return (
    <div className="p-6">
      {category.subLinks && category.subLinks.length > 0 && (
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border/40">
          {category.subLinks.map((sl) => (
            <Link key={sl.label} href={sl.href} className="text-xs text-foreground/60 hover:text-gold transition-colors tracking-wide">
              {sl.label}
            </Link>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-x-8 gap-y-1 xl:grid-cols-4">
        {category.brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/category/${category.slug}?brand=${brand.slug}`}
            className="group flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-secondary/40 transition-colors"
          >
            <BrandLogo letter={brand.logo} />
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-foreground/80 group-hover:text-gold transition-colors">{brand.name}</span>
              <span className="text-[10px] text-muted-foreground">{brand.nameEn}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function AccessoryPanel() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border/40">
        <Link href="/category/accessories" className="text-xs text-foreground/60 hover:text-gold transition-colors tracking-wide">
          所有商品
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-x-6 gap-y-1">
        {accessorySubItems.map((item) => (
          <Link
            key={item.slug}
            href={`/category/accessories?type=${item.slug}`}
            className="group flex items-center gap-2.5 rounded-md px-2 py-2.5 hover:bg-secondary/40 transition-colors"
          >
            <span className="size-7 shrink-0 inline-flex items-center justify-center rounded bg-gold/10 border border-gold/20 text-gold font-bold uppercase text-[8px]">
              {item.label.charAt(0)}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-foreground/80 group-hover:text-gold transition-colors">{item.labelZh}</span>
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ArticlesPanel() {
  const articleLinks = [
    { label: "全部文章", href: "/articles" },
    { label: "雪茄快訊", href: "/articles?tag=news" },
    { label: "品味生活", href: "/articles?tag=lifestyle" },
    { label: "茄時在線", href: "/articles?tag=online" },
  ]
  const infoLinks = [
    { label: "關於雪茄時間", href: "/about" },
    { label: "服務條款", href: "/terms" },
    { label: "私隱政策", href: "/privacy" },
  ]
  const clubLinks = [
    { label: "TIME Club", href: "/club" },
    { label: "古巴小雪茄獎賞計劃", href: "/club/rewards" },
    { label: "新會員推薦計劃", href: "/club/referral" },
  ]
  return (
    <div className="flex gap-10 p-6">
      <div className="min-w-[150px]">
        <h4 className="text-gold text-xs font-semibold uppercase tracking-widest mb-3">茄時分享</h4>
        <ul className="flex flex-col gap-1.5">
          {articleLinks.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className="text-sm text-foreground/70 hover:text-gold transition-colors">{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-[150px]">
        <h4 className="text-gold text-xs font-semibold uppercase tracking-widest mb-3">關於我們</h4>
        <ul className="flex flex-col gap-1.5">
          {infoLinks.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className="text-sm text-foreground/70 hover:text-gold transition-colors">{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-[150px]">
        <h4 className="text-gold text-xs font-semibold uppercase tracking-widest mb-3">會員專屬</h4>
        <ul className="flex flex-col gap-1.5">
          {clubLinks.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className="text-sm text-foreground/70 hover:text-gold transition-colors">{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ─── mobile accordion ─── */
function MobileNavSection({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const [open, setOpen] = useState(false)
  const cat = item.categorySlug ? categories.find((c) => c.slug === item.categorySlug) : null
  const hasBrandSub = item.megaKey === "brands" && cat && cat.brands.length > 0
  const hasPromoSub = item.megaKey === "promos"
  const hasArticleSub = item.megaKey === "articles"
  const hasAccessorySub = item.megaKey === "accessories"
  const hasSub = hasBrandSub || hasPromoSub || hasArticleSub || hasAccessorySub

  if (!hasSub) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className="flex items-center justify-between px-3 py-3 text-sm text-foreground/80 hover:text-gold hover:bg-secondary/50 rounded-md transition-colors"
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-3 text-sm text-foreground/80 hover:text-gold hover:bg-secondary/50 rounded-md transition-colors"
      >
        {item.label}
        <ChevronRight className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="ml-3 border-l border-border/30 pl-3 pb-2">
          {hasBrandSub && cat && (
            <>
              {cat.subLinks?.map((sl) => (
                <Link key={sl.label} href={sl.href} onClick={onNavigate} className="block px-2 py-1.5 text-xs text-gold/70 hover:text-gold transition-colors">{sl.label}</Link>
              ))}
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
                {cat.brands.map((brand) => (
                  <Link key={brand.slug} href={`/category/${cat.slug}?brand=${brand.slug}`} onClick={onNavigate} className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground/70 hover:text-gold rounded transition-colors">
                    <BrandLogo letter={brand.logo} />
                    <span className="truncate">{brand.name}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
          {hasPromoSub && (
            <>
              <p className="px-2 pt-1 pb-1 text-[10px] text-gold/50 uppercase tracking-widest">推廣活動</p>
              {promotionLinks.map((l) => (
                <Link key={l.label} href={l.href} onClick={onNavigate} className="block px-2 py-1.5 text-xs text-foreground/70 hover:text-gold transition-colors">{l.label}</Link>
              ))}
              <p className="px-2 pt-2 pb-1 text-[10px] text-gold/50 uppercase tracking-widest">VIP</p>
              {vipLinks.map((l) => (
                <Link key={l.label} href={l.href} onClick={onNavigate} className="block px-2 py-1.5 text-xs text-foreground/70 hover:text-gold transition-colors">{l.label}</Link>
              ))}
            </>
          )}
          {hasAccessorySub && (
            <>
              <Link href="/category/accessories" onClick={onNavigate} className="block px-2 py-1.5 text-xs text-gold/70 hover:text-gold transition-colors">所有商品</Link>
              {accessorySubItems.map((a) => (
                <Link key={a.slug} href={`/category/accessories?type=${a.slug}`} onClick={onNavigate} className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground/70 hover:text-gold transition-colors">
                  <BrandLogo letter={a.label.charAt(0)} />
                  <span>{a.labelZh}</span>
                </Link>
              ))}
            </>
          )}
          {hasArticleSub && (
            <>
              {[{ label: "全部文章", href: "/articles" }, { label: "雪茄快訊", href: "/articles?tag=news" }, { label: "品味生活", href: "/articles?tag=lifestyle" }].map((l) => (
                <Link key={l.label} href={l.href} onClick={onNavigate} className="block px-2 py-1.5 text-xs text-foreground/70 hover:text-gold transition-colors">{l.label}</Link>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── language switcher dropdown ─── */
function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState("zh-Hant")
  const closeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const current = languages.find((l) => l.code === lang)!

  return (
    <div
      className="relative"
      onMouseEnter={() => { if (closeRef.current) clearTimeout(closeRef.current); setOpen(true) }}
      onMouseLeave={() => { closeRef.current = setTimeout(() => setOpen(false), 200) }}
    >
      <button
        className="hidden sm:flex items-center gap-1 px-2 py-1.5 text-xs text-foreground/50 hover:text-gold transition-colors"
        aria-label="語言切換"
        onClick={() => setOpen((p) => !p)}
      >
        <Globe className="size-3.5" />
        <span>{current.short}</span>
        <ChevronDown className={cn("size-2.5 opacity-50 transition-transform", open && "rotate-180")} />
      </button>
      <div
        className={cn(
          "absolute right-0 top-full mt-1 z-50 w-36 bg-card border border-border/50 rounded-md shadow-xl py-1 transition-all duration-150",
          open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1 pointer-events-none"
        )}
      >
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => { setLang(l.code); setOpen(false) }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-xs transition-colors",
              l.code === lang ? "text-gold" : "text-foreground/60 hover:text-gold hover:bg-secondary/40"
            )}
          >
            <span>{l.label}</span>
            {l.code === lang && <Check className="size-3 text-gold" />}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════ HEADER ═══════════════════════════ */
export function SiteHeader() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [showBanner, setShowBanner] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cartCount = useCart(selectTotalItems)

  const openMenu = useCallback((key: string) => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
    setActiveMenu(key)
  }, [])

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => { setActiveMenu(null); closeTimer.current = null }, 300)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }, [])

  const activeCategorySlug = navItems.find(
    (n) => n.megaKey === "brands" && activeMenu === n.categorySlug
  )?.categorySlug
  const activeCategory = activeCategorySlug
    ? categories.find((c) => c.slug === activeCategorySlug)
    : null
  const showMega = activeMenu !== null

  return (
    <header className="sticky top-0 z-50">
      {/* ── top banner ── */}
      {showBanner && (
        <div className="bg-gold/90 text-primary-foreground relative flex items-center justify-center px-4 py-2 text-xs tracking-wider">
          <span>全場滿 US$200 免運費 | 新會員享首單 9 折優惠</span>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            aria-label="關閉橫幅"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ── nav + mega wrapper ── */}
      <div onMouseLeave={scheduleClose} className="relative">
        {/* main header bar */}
        <div className="bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center px-4 lg:px-6">
            {/* mobile trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="lg:hidden p-2 -ml-2 text-foreground/70 hover:text-foreground transition-colors" aria-label="打開選單">
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] bg-background border-border overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-gold font-serif text-lg tracking-wider">TIMECIGAR</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-0.5 mt-4">
                  {navItems.map((item) => (
                    <MobileNavSection key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
                  ))}
                  {/* mobile language */}
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <p className="px-3 pb-2 text-[10px] text-gold/50 uppercase tracking-widest">語言</p>
                    {languages.map((l) => (
                      <button key={l.code} className="flex w-full items-center justify-between px-3 py-2 text-sm text-foreground/70 hover:text-gold transition-colors">
                        <span>{l.label}</span>
                        {l.code === "zh-Hant" && <Check className="size-3.5 text-gold" />}
                      </button>
                    ))}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-4 lg:mr-6">
              <span className="text-xl font-serif font-bold tracking-[0.2em] text-gold">TIMECIGAR</span>
              <span className="hidden sm:block text-[10px] text-muted-foreground tracking-widest leading-none">
                雪茄時間
              </span>
            </Link>

            {/* desktop nav -- scrollable on medium screens */}
            <nav className="hidden lg:flex items-center flex-1 min-w-0">
              <div className="flex items-center overflow-x-auto scrollbar-none">
                {navItems.map((item) => {
                  const key = item.megaKey === "brands" ? item.categorySlug! : item.megaKey!
                  const isActive = activeMenu === key
                  return (
                    <div key={item.label} className="shrink-0" onMouseEnter={() => openMenu(key)}>
                      <Link
                        href={item.href}
                        onClick={() => setActiveMenu(null)}
                        className={cn(
                          "flex items-center gap-0.5 whitespace-nowrap px-2.5 py-2 text-[13px] tracking-wide transition-colors xl:px-3",
                          isActive ? "text-gold" : "text-foreground/65 hover:text-gold"
                        )}
                      >
                        {item.label}
                        {item.megaKey && <ChevronDown className={cn("size-3 opacity-40 transition-transform duration-200", isActive && "rotate-180")} />}
                      </Link>
                    </div>
                  )
                })}
              </div>
            </nav>

            {/* right icons */}
            <div className="flex items-center gap-0.5 shrink-0 ml-auto">
              <LanguageSwitcher />
              <button className="p-2 text-foreground/60 hover:text-gold transition-colors" aria-label="搜尋">
                <Search className="size-[18px]" />
              </button>
              <Link href="/cart" className="p-2 text-foreground/60 hover:text-gold transition-colors" aria-label="帳戶">
                <User className="size-[18px]" />
              </Link>
              <Link href="/cart" className="relative p-2 text-foreground/60 hover:text-gold transition-colors" aria-label="購物車">
                <ShoppingBag className="size-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 flex size-3.5 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-primary-foreground">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ══ mega-menu panel ══ */}
        <div
          className={cn(
            "absolute left-0 right-0 top-full z-40 bg-card border-b border-border/40 shadow-2xl transition-all duration-200 ease-out overflow-hidden",
            showMega
              ? "opacity-100 visible translate-y-0"
              : "opacity-0 invisible -translate-y-2 pointer-events-none"
          )}
          onMouseEnter={cancelClose}
        >
          <div className="mx-auto max-w-[1400px]">
            {activeMenu === "promos" && <PromoPanel />}
            {activeMenu === "accessories" && <AccessoryPanel />}
            {activeMenu === "articles" && <ArticlesPanel />}
            {activeCategory && <BrandPanel category={activeCategory} />}
          </div>
        </div>
      </div>

      {/* backdrop */}
      {showMega && (
        <div
          className="fixed inset-0 z-[-1] bg-background/50"
          onClick={() => setActiveMenu(null)}
          aria-hidden="true"
        />
      )}
    </header>
  )
}

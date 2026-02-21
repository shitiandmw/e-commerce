"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, User, ShoppingBag, Menu, ChevronDown, ChevronRight, Globe, Check, LogIn } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCart, selectTotalItems } from "@/lib/cart-store"
import { isLoggedIn } from "@/lib/auth"
import { cn } from "@/lib/utils"
import type { MenuItem, MenuBrand } from "@/lib/data/menu"

/* ─── brand logo ─── */
function BrandLogo({ brand, size = "sm" }: { brand: MenuBrand; size?: "sm" | "md" }) {
  const dim = size === "md" ? "size-9" : "size-7"
  if (brand.logo_url) {
    return (
      <span className={cn(dim, "shrink-0 inline-flex items-center justify-center rounded bg-gold/10 border border-gold/20 overflow-hidden")}>
        <Image src={brand.logo_url} alt={brand.name} width={size === "md" ? 36 : 28} height={size === "md" ? 36 : 28} className="object-contain" />
      </span>
    )
  }
  const text = size === "md" ? "text-[10px]" : "text-[8px]"
  const letter = brand.name.charAt(0).toUpperCase()
  return (
    <span className={cn(dim, "shrink-0 inline-flex items-center justify-center rounded bg-gold/10 border border-gold/20 text-gold font-bold uppercase", text)}>
      {letter}
    </span>
  )
}

/* ─── language options ─── */
const languages = [
  { code: "zh-Hant", label: "繁體中文", short: "繁中" },
  { code: "zh-Hans", label: "简体中文", short: "简中" },
  { code: "en", label: "English", short: "EN" },
]

/* ─── mega menu: columns panel (links grouped by children) ─── */
function ColumnsPanel({ item, onNavigate }: { item: MenuItem; onNavigate?: () => void }) {
  return (
    <div className="flex gap-8 p-6 overflow-x-auto">
      {item.children.map((group) => (
        <div key={group.id} className="min-w-[170px]">
          <h4 className="text-gold text-xs font-semibold uppercase tracking-widest mb-3">{group.label}</h4>
          <ul className="flex flex-col gap-1.5">
            {group.children.map((link) => (
              <li key={link.id}>
                <Link href={link.url || "#"} onClick={onNavigate} className="text-sm text-foreground/70 hover:text-gold transition-colors leading-relaxed">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/* ─── mega menu: brand grid panel ─── */
function BrandGridPanel({ item, onNavigate }: { item: MenuItem; onNavigate?: () => void }) {
  // Collect sub-links (non-brand children) and brand items
  const subLinks = item.children.filter((c) => c.metadata?.item_type !== "brand")
  const brandItems = item.children.filter((c) => c.metadata?.item_type === "brand")

  return (
    <div className="p-6">
      {subLinks.length > 0 && (
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border/40">
          {subLinks.map((sl) => (
            <Link key={sl.id} href={sl.url || "#"} onClick={onNavigate} className="text-xs text-foreground/60 hover:text-gold transition-colors tracking-wide">
              {sl.label}
            </Link>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-x-8 gap-y-1 xl:grid-cols-4">
        {brandItems.map((bi) => {
          const brands = bi.brands || []
          return brands.map((brand) => (
            <Link
              key={brand.id}
              href={bi.url ? `${bi.url}?brand=${brand.id}` : `#`}
              onClick={onNavigate}
              className="group flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-secondary/40 transition-colors"
            >
              <BrandLogo brand={brand} />
              <span className="text-sm text-foreground/80 group-hover:text-gold transition-colors">{brand.name}</span>
            </Link>
          ))
        })}
      </div>
    </div>
  )
}

/* ─── menu item icon ─── */
function MenuIcon({ item, size = "sm" }: { item: MenuItem; size?: "sm" | "md" }) {
  const dim = size === "md" ? "size-9" : "size-7"
  const text = size === "md" ? "text-[10px]" : "text-[8px]"
  if (item.icon_url) {
    return (
      <span className={cn(dim, "shrink-0 inline-flex items-center justify-center rounded overflow-hidden")}>
        <Image src={item.icon_url} alt={item.label} width={size === "md" ? 36 : 28} height={size === "md" ? 36 : 28} className="object-contain" />
      </span>
    )
  }
  return (
    <span className={cn(dim, "shrink-0 inline-flex items-center justify-center rounded bg-gold/10 border border-gold/20 text-gold font-bold uppercase", text)}>
      {item.label.charAt(0)}
    </span>
  )
}

/* ─── mega menu: generic links panel ─── */
function LinksPanel({ item, onNavigate }: { item: MenuItem; onNavigate?: () => void }) {
  return (
    <div className="p-6">
      {item.children.length > 0 && (
        <div className="grid grid-cols-4 gap-x-6 gap-y-1">
          {item.children.map((child) => (
            <Link
              key={child.id}
              href={child.url || "#"}
              onClick={onNavigate}
              className="group flex items-center gap-2.5 rounded-md px-2 py-2.5 hover:bg-secondary/40 transition-colors"
            >
              <MenuIcon item={child} />
              <span className="text-sm text-foreground/80 group-hover:text-gold transition-colors">{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── resolve which panel to render ─── */
function MegaPanel({ item, onNavigate }: { item: MenuItem; onNavigate?: () => void }) {
  const hasBrandChildren = item.children.some((c) => c.metadata?.item_type === "brand")
  const hasGroupedColumns = !hasBrandChildren && item.children.some((c) => c.children.length > 0)

  if (hasBrandChildren) return <BrandGridPanel item={item} onNavigate={onNavigate} />
  if (hasGroupedColumns) return <ColumnsPanel item={item} onNavigate={onNavigate} />
  if (item.children.length > 0) return <LinksPanel item={item} onNavigate={onNavigate} />
  return null
}

/* ─── mobile accordion ─── */
function MobileNavSection({ item, onNavigate }: { item: MenuItem; onNavigate: () => void }) {
  const [open, setOpen] = useState(false)
  const hasSub = item.children.length > 0

  if (!hasSub) {
    return (
      <Link
        href={item.url || "#"}
        onClick={onNavigate}
        className="flex items-center justify-between px-3 py-3 text-sm text-foreground/80 hover:text-gold hover:bg-secondary/50 rounded-md transition-colors"
      >
        {item.label}
      </Link>
    )
  }

  const hasBrandChildren = item.children.some((c) => c.metadata?.item_type === "brand")
  const subLinks = item.children.filter((c) => c.metadata?.item_type !== "brand")
  const brandItems = item.children.filter((c) => c.metadata?.item_type === "brand")

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
          {hasBrandChildren ? (
            <>
              {subLinks.map((sl) => (
                <Link key={sl.id} href={sl.url || "#"} onClick={onNavigate} className="block px-2 py-1.5 text-xs text-gold/70 hover:text-gold transition-colors">{sl.label}</Link>
              ))}
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
                {brandItems.flatMap((bi) =>
                  (bi.brands || []).map((brand) => (
                    <Link key={brand.id} href={bi.url ? `${bi.url}?brand=${brand.id}` : "#"} onClick={onNavigate} className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground/70 hover:text-gold rounded transition-colors">
                      <BrandLogo brand={brand} />
                      <span className="truncate">{brand.name}</span>
                    </Link>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {item.children.map((child) =>
                child.children.length > 0 ? (
                  <div key={child.id}>
                    <p className="px-2 pt-2 pb-1 text-[10px] text-gold/50 uppercase tracking-widest">{child.label}</p>
                    {child.children.map((link) => (
                      <Link key={link.id} href={link.url || "#"} onClick={onNavigate} className="block px-2 py-1.5 text-xs text-foreground/70 hover:text-gold transition-colors">{link.label}</Link>
                    ))}
                  </div>
                ) : (
                  <Link key={child.id} href={child.url || "#"} onClick={onNavigate} className="block px-2 py-1.5 text-xs text-foreground/70 hover:text-gold transition-colors">{child.label}</Link>
                )
              )}
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
export function SiteHeader({ navItems }: { navItems: MenuItem[] }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cartCount = useCart(selectTotalItems)
  const [cartBounce, setCartBounce] = useState(false)
  const prevCartCount = useRef(cartCount)
  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBounce(true)
      const t = setTimeout(() => setCartBounce(false), 300)
      return () => clearTimeout(t)
    }
    prevCartCount.current = cartCount
  }, [cartCount])
  const [loggedIn, setLoggedIn] = useState(false)
  useEffect(() => {
    const sync = () => setLoggedIn(isLoggedIn())
    sync()
    window.addEventListener("auth-change", sync)
    return () => window.removeEventListener("auth-change", sync)
  }, [])

  const openMenu = useCallback((id: string) => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
    setActiveMenu(id)
  }, [])

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => { setActiveMenu(null); closeTimer.current = null }, 300)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }, [])

  const activeItem = navItems.find((n) => n.id === activeMenu)
  const showMega = activeItem != null && activeItem.children.length > 0

  return (
    <header className="sticky top-0 z-50">
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
                    <MobileNavSection key={item.id} item={item} onNavigate={() => setMobileOpen(false)} />
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

            {/* desktop nav */}
            <nav className="hidden lg:flex items-center flex-1 min-w-0">
              <div className="flex items-center overflow-x-auto scrollbar-none">
                {navItems.map((item) => {
                  const isActive = activeMenu === item.id
                  const hasChildren = item.children.length > 0
                  return (
                    <div key={item.id} className="shrink-0" onMouseEnter={() => hasChildren ? openMenu(item.id) : setActiveMenu(null)}>
                      <Link
                        href={item.url || "#"}
                        onClick={() => setActiveMenu(null)}
                        className={cn(
                          "flex items-center gap-0.5 whitespace-nowrap px-2.5 py-2 text-[13px] tracking-wide transition-colors xl:px-3",
                          isActive ? "text-gold" : "text-foreground/65 hover:text-gold"
                        )}
                      >
                        {item.label}
                        {hasChildren && <ChevronDown className={cn("size-3 opacity-40 transition-transform duration-200", isActive && "rotate-180")} />}
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
              <Link href={loggedIn ? "/account" : "/login"} className="p-2 text-foreground/60 hover:text-gold transition-colors" aria-label={loggedIn ? "帳戶" : "登入"}>
                {loggedIn ? <User className="size-[18px]" /> : <LogIn className="size-[18px]" />}
              </Link>
              <Link href="/cart" className="relative p-2 text-foreground/60 hover:text-gold transition-colors" aria-label="購物車">
                <ShoppingBag className="size-[18px]" />
                {cartCount > 0 && (
                  <span className={cn(
                    "absolute top-0 right-0 flex size-3.5 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-primary-foreground transition-transform",
                    cartBounce && "animate-[cart-bounce_0.3s_ease-out]"
                  )}>
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
            {activeItem && <MegaPanel item={activeItem} onNavigate={() => setActiveMenu(null)} />}
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

"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useCart } from "@/components/CartProvider"
import type { Locale } from "@/lib/i18n"

type MenuItem = {
  id: string
  label: string
  url: string
  sort_order: number
  children: MenuItem[]
}

const LOCALE_LABELS: Record<string, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
}

const LOCALES = ["zh-CN", "zh-TW", "en"] as const

// SVG Icons
function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function CartIcon({ count }: { count: number }) {
  return (
    <span className="relative">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-background">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  )
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

// Language switcher dropdown
function LanguageSwitcher({ locale, dict }: { locale: Locale; dict: Record<string, string> }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function switchLocale(newLocale: string) {
    // Remove current locale prefix from pathname
    const pathWithoutLocale = pathname.replace(/^\/(zh-CN|zh-TW|en)/, "") || "/"
    // Set cookie to remember choice
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`
    router.push(`/${newLocale}${pathWithoutLocale}`)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-gold"
        aria-label={dict.language || "Language"}
      >
        <GlobeIcon />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[140px] rounded-md border border-border bg-surface py-1 shadow-lg">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-surface-light hover:text-gold ${
                loc === locale ? "text-gold font-medium" : "text-muted"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Desktop dropdown menu item
function DesktopMenuItem({ item, locale }: { item: MenuItem; locale: Locale }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const localizeUrl = (url: string) => `/${locale}${url}`

  if (item.children.length === 0) {
    return (
      <Link href={localizeUrl(item.url)} className="text-sm text-muted transition-colors hover:text-gold">
        {item.label}
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-gold"
      >
        {item.label}
        <ChevronDown />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 min-w-[160px] rounded-md border border-border bg-surface py-1 shadow-lg">
          <Link
            href={localizeUrl(item.url)}
            className="block px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-light hover:text-gold"
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
          {item.children.map((child) => (
            <Link
              key={child.id}
              href={localizeUrl(child.url)}
              className="block px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-light hover:text-gold"
              onClick={() => setOpen(false)}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// Mobile sidebar menu item
function MobileMenuItem({ item, locale, onClose }: { item: MenuItem; locale: Locale; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const localizeUrl = (url: string) => `/${locale}${url}`

  if (item.children.length === 0) {
    return (
      <Link href={localizeUrl(item.url)} onClick={onClose} className="block py-3 text-base text-foreground transition-colors hover:text-gold">
        {item.label}
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between py-3 text-base text-foreground transition-colors hover:text-gold"
      >
        {item.label}
        <span className={`transition-transform ${expanded ? "rotate-180" : ""}`}><ChevronDown /></span>
      </button>
      {expanded && (
        <div className="ml-4 border-l border-border pl-4">
          <Link href={localizeUrl(item.url)} onClick={onClose} className="block py-2 text-sm text-muted transition-colors hover:text-gold">
            {item.label}
          </Link>
          {item.children.map((child) => (
            <Link key={child.id} href={localizeUrl(child.url)} onClick={onClose} className="block py-2 text-sm text-muted transition-colors hover:text-gold">
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HeaderClient({ menuItems, locale, dict }: { menuItems: MenuItem[]; locale: Locale; dict: Record<string, string> }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount: cartCount } = useCart()

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-8 md:flex">
        {menuItems.map((item) => (
          <DesktopMenuItem key={item.id} item={item} locale={locale} />
        ))}
      </nav>

      {/* Right side icons */}
      <div className="flex items-center gap-1 md:gap-3">
        <LanguageSwitcher locale={locale} dict={dict} />
        <Link href={`/${locale}/search`} className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-gold" aria-label={dict.search}>
          <SearchIcon />
        </Link>
        <Link href={`/${locale}/account`} className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-gold" aria-label={dict.account}>
          <UserIcon />
        </Link>
        <Link href={`/${locale}/cart`} className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-gold" aria-label={dict.cart}>
          <CartIcon count={cartCount} />
        </Link>
        {/* Mobile hamburger */}
        <button
          className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-gold md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label={dict.open_menu}
        >
          <MenuIcon />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-background p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold text-gold">TIMECIGAR</span>
              <button onClick={() => setMobileOpen(false)} className="text-muted hover:text-foreground" aria-label={dict.close_menu}>
                <CloseIcon />
              </button>
            </div>
            <nav className="divide-y divide-border">
              {menuItems.map((item) => (
                <MobileMenuItem key={item.id} item={item} locale={locale} onClose={() => setMobileOpen(false)} />
              ))}
            </nav>
            <div className="mt-6 space-y-3 border-t border-border pt-6">
              <Link href={`/${locale}/search`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-muted hover:text-gold">
                <SearchIcon /> {dict.search}
              </Link>
              <Link href={`/${locale}/account`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-muted hover:text-gold">
                <UserIcon /> {dict.my_account}
              </Link>
              <Link href={`/${locale}/cart`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-muted hover:text-gold">
                <CartIcon count={cartCount} /> {dict.cart}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

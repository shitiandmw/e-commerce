"use client"

import Link from "next/link"
import { useState, useRef, useEffect, useCallback } from "react"
import { useCart } from "@/components/CartProvider"
import type { MenuItem, Brand } from "./Header"
import type { Locale } from "@/lib/i18n"

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
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

// Brand Logo Grid for Mega Menu — flat grid with logo + bilingual name
function BrandGrid({ brands }: { brands: Brand[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
      {brands.map((brand) => {
        const nameZh = (brand as any).name_zh || ""
        return (
          <Link
            key={brand.id}
            href={`/brands/${brand.id}`}
            className="group/brand flex flex-col items-center gap-1.5 rounded-lg border border-transparent p-2 text-center transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-surface-light">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-lg font-bold text-gold">{brand.name.charAt(0)}</span>
              )}
            </div>
            {nameZh && <span className="text-xs font-medium text-foreground">{nameZh}</span>}
            <span className="text-[11px] text-muted">{brand.name}</span>
          </Link>
        )
      })}
    </div>
  )
}

// Mega Menu Panel for desktop — dual-column: left subcategories + right brand grid
function MegaMenuPanel({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const hasBrands = item.brands && item.brands.length > 0
  const hasChildren = item.children.length > 0

  return (
    <div className="border-b border-border bg-background/98 shadow-xl backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {hasChildren && hasBrands ? (
          /* Dual-column: subcategories left + brand grid right */
          <div className="flex gap-8">
            <div className="w-48 shrink-0 border-r border-border pr-6">
              <h3 className="mb-3 text-sm font-semibold text-gold">{item.label}</h3>
              <ul className="space-y-1.5">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={child.url || "#"}
                      onClick={onClose}
                      className="block py-1 text-sm text-muted transition-colors hover:text-gold"
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {item.url && (
                <Link href={item.url} onClick={onClose} className="mt-4 block text-xs text-gold transition-colors hover:text-gold-light">
                  查看全部 →
                </Link>
              )}
            </div>
            <div className="flex-1">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gold">品牌</h3>
              </div>
              <BrandGrid brands={item.brands!} />
            </div>
          </div>
        ) : hasBrands ? (
          /* Brand-only: full-width brand grid */
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gold">{item.label}</h3>
              {item.url && (
                <Link href={item.url} onClick={onClose} className="text-xs text-muted transition-colors hover:text-gold">
                  查看全部 →
                </Link>
              )}
            </div>
            <BrandGrid brands={item.brands!} />
          </div>
        ) : (
          /* Category-only: multi-column layout */
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {item.children.map((col) => (
              <div key={col.id}>
                <Link
                  href={col.url || "#"}
                  onClick={onClose}
                  className="mb-3 block text-sm font-semibold text-gold transition-colors hover:text-gold/80"
                >
                  {col.label}
                </Link>
                {col.children.length > 0 && (
                  <ul className="space-y-1.5">
                    {col.children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={sub.url || "#"}
                          onClick={onClose}
                          className="block text-sm text-muted transition-colors hover:text-gold"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
// Desktop menu item with Mega Menu support
function DesktopMenuItem({ item, onOpenMega, onCloseMega, isOpen }: {
  item: MenuItem
  onOpenMega: (id: string) => void
  onCloseMega: () => void
  isOpen: boolean
}) {
  const hasChildren = item.children.length > 0
  const hasBrands = item.brands && item.brands.length > 0
  const showMega = hasChildren || hasBrands

  if (!showMega) {
    return (
      <Link
        href={item.url || "#"}
        className="text-sm text-muted transition-colors hover:text-gold"
        onMouseEnter={onCloseMega}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <button
      onMouseEnter={() => onOpenMega(item.id)}
      className={`flex items-center gap-1 text-sm transition-colors ${
        isOpen ? "text-gold" : "text-muted hover:text-gold"
      }`}
    >
      {item.label}
      <ChevronDown className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
    </button>
  )
}

// Mobile accordion menu item (recursive)
function MobileMenuItem({ item, onClose, depth = 0 }: { item: MenuItem; onClose: () => void; depth?: number }) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = item.children.length > 0
  const hasBrands = item.brands && item.brands.length > 0

  if (!hasChildren && !hasBrands) {
    return (
      <Link
        href={item.url || "#"}
        onClick={onClose}
        className="block py-3 text-base text-foreground transition-colors hover:text-gold"
        style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : undefined }}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between py-3 text-base text-foreground transition-colors hover:text-gold"
        style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : undefined }}
      >
        {item.label}
        <ChevronDown className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="border-l border-border ml-2 pl-2">
          {item.url && (
            <Link href={item.url} onClick={onClose} className="block py-2 text-sm text-gold transition-colors hover:text-gold/80">
              查看全部
            </Link>
          )}
          {hasBrands ? (
            <div className="space-y-1 py-2">
              {item.brands!.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/brands/${brand.id}`}
                  onClick={onClose}
                  className="flex items-center gap-2 py-1.5 text-sm text-muted transition-colors hover:text-gold"
                >
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} className="h-5 w-5 rounded object-contain" />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-light text-[9px] font-bold text-gold">
                      {brand.name.charAt(0)}
                    </span>
                  )}
                  {brand.name}
                </Link>
              ))}
            </div>
          ) : (
            item.children.map((child) => (
              <MobileMenuItem key={child.id} item={child} onClose={onClose} depth={depth + 1} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
export default function HeaderClient({ menuItems, locale, dict }: {
  menuItems: MenuItem[]
  locale: Locale
  dict: Record<string, string>
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMegaId, setOpenMegaId] = useState<string | null>(null)
  const { itemCount: cartCount } = useCart()
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openMegaItem = menuItems.find((item) => item.id === openMegaId)

  const handleOpenMega = useCallback((id: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpenMegaId(id)
  }, [])

  const handleCloseMega = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setOpenMegaId(null)
    }, 150)
  }, [])

  // Close mega menu on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMegaId(null)
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  return (
    <>
      {/* Desktop nav + mega panel wrapper: shared hover context */}
      <div
        className="hidden md:flex items-center gap-8"
        onMouseLeave={handleCloseMega}
      >
        <nav className="flex items-center gap-8">
          {menuItems.map((item) => (
            <DesktopMenuItem
              key={item.id}
              item={item}
              onOpenMega={handleOpenMega}
              onCloseMega={handleCloseMega}
              isOpen={openMegaId === item.id}
            />
          ))}
        </nav>
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-1 md:gap-3">
        <Link href="/search" className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-gold" aria-label="搜索">
          <SearchIcon />
        </Link>
        <Link href="/account" className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-gold" aria-label="账户">
          <UserIcon />
        </Link>
        <Link href="/cart" className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-gold" aria-label="购物车">
          <CartIcon count={cartCount} />
        </Link>
        {/* Mobile hamburger */}
        <button
          className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-gold md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="打开菜单"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Mega Menu Panel (desktop) — positioned relative to <header> */}
      <div
        className={`absolute left-0 right-0 top-full z-50 hidden md:block transition-all duration-200 ease-out ${
          openMegaItem
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        onMouseEnter={() => {
          if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current)
            closeTimerRef.current = null
          }
        }}
        onMouseLeave={() => setOpenMegaId(null)}
      >
        {openMegaItem && (
          <MegaMenuPanel item={openMegaItem} onClose={() => setOpenMegaId(null)} />
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 overflow-y-auto bg-background p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold text-gold">TIMECIGAR</span>
              <button onClick={() => setMobileOpen(false)} className="text-muted hover:text-foreground" aria-label="关闭菜单">
                <CloseIcon />
              </button>
            </div>
            <nav className="divide-y divide-border">
              {menuItems.map((item) => (
                <MobileMenuItem key={item.id} item={item} onClose={() => setMobileOpen(false)} />
              ))}
            </nav>
            <div className="mt-6 space-y-3 border-t border-border pt-6">
              <Link href="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-muted hover:text-gold">
                <SearchIcon /> 搜索
              </Link>
              <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-muted hover:text-gold">
                <UserIcon /> 我的账户
              </Link>
              <Link href="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-muted hover:text-gold">
                <CartIcon count={cartCount} /> 购物车
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

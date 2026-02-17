"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useCart } from "@/components/CartProvider"

type MenuItem = {
  id: string
  label: string
  url: string
  sort_order: number
  children: MenuItem[]
}

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

// Desktop dropdown menu item
function DesktopMenuItem({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (item.children.length === 0) {
    return (
      <Link href={item.url} className="text-sm text-muted transition-colors hover:text-gold">
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
            href={item.url}
            className="block px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-light hover:text-gold"
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
          {item.children.map((child) => (
            <Link
              key={child.id}
              href={child.url}
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
function MobileMenuItem({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false)

  if (item.children.length === 0) {
    return (
      <Link href={item.url} onClick={onClose} className="block py-3 text-base text-foreground transition-colors hover:text-gold">
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
          <Link href={item.url} onClick={onClose} className="block py-2 text-sm text-muted transition-colors hover:text-gold">
            {item.label}
          </Link>
          {item.children.map((child) => (
            <Link key={child.id} href={child.url} onClick={onClose} className="block py-2 text-sm text-muted transition-colors hover:text-gold">
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HeaderClient({ menuItems }: { menuItems: MenuItem[] }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount: cartCount } = useCart()

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-8 md:flex">
        {menuItems.map((item) => (
          <DesktopMenuItem key={item.id} item={item} />
        ))}
      </nav>

      {/* Right side icons */}
      <div className="flex items-center gap-3">
        <Link href="/search" className="text-muted transition-colors hover:text-gold" aria-label="搜索">
          <SearchIcon />
        </Link>
        <Link href="/account" className="text-muted transition-colors hover:text-gold" aria-label="账户">
          <UserIcon />
        </Link>
        <Link href="/cart" className="text-muted transition-colors hover:text-gold" aria-label="购物车">
          <CartIcon count={cartCount} />
        </Link>
        {/* Mobile hamburger */}
        <button
          className="text-muted transition-colors hover:text-gold md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="打开菜单"
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

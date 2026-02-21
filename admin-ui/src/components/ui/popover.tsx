"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface PopoverContextType {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const PopoverContext = React.createContext<PopoverContextType>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  contentRef: { current: null },
})

function Popover({ children, className }: { children: React.ReactNode; className?: string }) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      )
        return
      setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className={cn("relative inline-block", className)}>
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

function PopoverTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(!open)
  }

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current = node
    },
    [triggerRef]
  )

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      ref,
    })
  }

  return (
    <button type="button" ref={ref as React.Ref<HTMLButtonElement>} onClick={handleClick}>
      {children}
    </button>
  )
}

function PopoverContent({
  children,
  className,
  align = "start",
}: {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
}) {
  const { open, triggerRef, contentRef } = React.useContext(PopoverContext)
  const [style, setStyle] = React.useState<React.CSSProperties>({})
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const pos: React.CSSProperties = {
      position: "fixed",
      top: rect.bottom + 4,
      width: rect.width,
      zIndex: 9999,
    }
    if (align === "end") pos.right = window.innerWidth - rect.right
    else if (align === "start") pos.left = rect.left
    else pos.left = rect.left + rect.width / 2
    setStyle(pos)
  }, [align, triggerRef])

  React.useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)
    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [open, updatePosition])

  if (!open || !mounted) return null

  return createPortal(
    <div
      ref={contentRef as React.RefObject<HTMLDivElement>}
      style={style}
      className={cn(
        "overflow-hidden rounded-md border bg-background shadow-md animate-in fade-in-0 zoom-in-95",
        align === "center" && "-translate-x-1/2",
        className
      )}
    >
      {children}
    </div>,
    document.body
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverContext }

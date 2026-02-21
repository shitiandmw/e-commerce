"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

interface OptionItem {
  value: string
  label: string
  disabled?: boolean
}

function extractOptions(children: React.ReactNode): OptionItem[] {
  const options: OptionItem[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === "option") {
      const props = child.props as any
      options.push({
        value: String(props.value ?? ""),
        label: String(
          typeof props.children === "string"
            ? props.children
            : props.children?.toString?.() ?? props.value ?? ""
        ),
        disabled: !!props.disabled,
      })
    }
  })
  return options
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, defaultValue, onChange, disabled, name, ...props }, ref) => {
    const options = extractOptions(children)
    const [open, setOpen] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)
    const [style, setStyle] = React.useState<React.CSSProperties>({})

    // Uncontrolled support
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState(
      String(defaultValue ?? options[0]?.value ?? "")
    )
    const currentValue = isControlled ? String(value) : internalValue

    const triggerRef = React.useRef<HTMLButtonElement>(null)
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const hiddenRef = React.useRef<HTMLSelectElement>(null)
    const setInternalRef = React.useRef(setInternalValue)
    setInternalRef.current = setInternalValue

    React.useEffect(() => setMounted(true), [])

    // Patch hidden select value setter for register() compatibility
    const combinedRef = React.useCallback(
      (el: HTMLSelectElement | null) => {
        (hiddenRef as React.MutableRefObject<HTMLSelectElement | null>).current = el
        if (typeof ref === "function") ref(el)
        else if (ref) (ref as React.MutableRefObject<HTMLSelectElement | null>).current = el
        if (!el) return
        const proto = Object.getPrototypeOf(el)
        const descriptor = Object.getOwnPropertyDescriptor(proto, "value")
        if (descriptor && !Object.getOwnPropertyDescriptor(el, "__patched")) {
          Object.defineProperty(el, "value", {
            get() { return descriptor.get?.call(this) },
            set(v: string) {
              descriptor.set?.call(this, v)
              setInternalRef.current(String(v))
            },
            configurable: true,
          })
          Object.defineProperty(el, "__patched", { value: true, configurable: true })
        }
      },
      [ref]
    )

    // Position dropdown below trigger
    const updatePosition = React.useCallback(() => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      setStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    }, [])

    // Close on outside click
    React.useEffect(() => {
      if (!open) return
      const handleClick = (e: MouseEvent) => {
        const target = e.target as Node
        if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
        setOpen(false)
      }
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }, [open])

    // Reposition on scroll/resize
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

    const handleSelect = (optionValue: string) => {
      setInternalValue(optionValue)
      setOpen(false)
      if (hiddenRef.current) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          HTMLSelectElement.prototype, "value"
        )?.set
        nativeSetter?.call(hiddenRef.current, optionValue)
        hiddenRef.current.dispatchEvent(new Event("change", { bubbles: true }))
      }
    }

    const selectedLabel =
      options.find((o) => o.value === currentValue)?.label || ""

    return (
      <div className={cn("relative", className)}>
        <select
          ref={combinedRef}
          name={name}
          value={currentValue}
          onChange={onChange}
          disabled={disabled}
          style={{ display: "none" }}
          aria-hidden
          tabIndex={-1}
          {...props}
        >
          {children}
        </select>

        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "relative flex h-10 w-full items-center rounded-md border border-input",
            "bg-background pl-3 pr-9 py-2 text-sm",
            "ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors hover:border-ring/50"
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </button>

        {open && mounted && createPortal(
          <div
            ref={dropdownRef}
            style={style}
            className="overflow-hidden rounded-md border bg-background shadow-md animate-in fade-in-0 zoom-in-95"
          >
            <div className="max-h-60 overflow-y-auto p-1">
              {options.map((opt, i) => (
                <div
                  key={`${opt.value}-${i}`}
                  className={cn(
                    "flex items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer",
                    "hover:bg-accent hover:text-accent-foreground",
                    opt.value === currentValue && "bg-accent/50",
                    opt.disabled && "pointer-events-none opacity-50"
                  )}
                  onClick={() => { if (!opt.disabled) handleSelect(opt.value) }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0",
                      opt.value === currentValue ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }

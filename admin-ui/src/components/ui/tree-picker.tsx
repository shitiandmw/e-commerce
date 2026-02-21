"use client"

import * as React from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent, PopoverContext } from "@/components/ui/popover"

interface TreeItem {
  id: string
  name?: string | null
}

interface TreePickerProps {
  items: { category: TreeItem; depth: number }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  parentIdKey?: string
}

export function TreePicker({
  items,
  value,
  onChange,
  placeholder = "",
  parentIdKey = "parent_id",
}: TreePickerProps) {
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set())

  const selectedName = React.useMemo(() => {
    if (!value) return null
    const found = items.find((i) => i.category.id === value)
    return found?.category.name || value
  }, [items, value])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {selectedName || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-h-60 overflow-y-auto p-1">
        <TreePickerList
          items={items}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          parentIdKey={parentIdKey}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </PopoverContent>
    </Popover>
  )
}

function TreePickerList({
  items,
  value,
  onChange,
  placeholder,
  parentIdKey,
  collapsed,
  setCollapsed,
}: {
  items: TreePickerProps["items"]
  value: string
  onChange: (value: string) => void
  placeholder: string
  parentIdKey: string
  collapsed: Set<string>
  setCollapsed: React.Dispatch<React.SetStateAction<Set<string>>>
}) {
  const { setOpen } = React.useContext(PopoverContext)

  const hasChildren = React.useMemo(() => {
    const set = new Set<string>()
    for (const { category } of items) {
      const pid = (category as any)[parentIdKey] as string | null | undefined
      if (pid) set.add(pid)
    }
    return set
  }, [items, parentIdKey])

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const visibleItems = React.useMemo(() => {
    const result: typeof items = []
    const hiddenParents = new Set<string>()
    for (const item of items) {
      const pid = (item.category as any)[parentIdKey] as string | null | undefined
      if (pid && (hiddenParents.has(pid) || collapsed.has(pid))) {
        hiddenParents.add(item.category.id)
        continue
      }
      result.push(item)
    }
    return result
  }, [items, collapsed, parentIdKey])

  const select = (id: string) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50",
          !value && "bg-accent"
        )}
        onClick={() => select("")}
      >
        <span className="text-muted-foreground">{placeholder}</span>
      </div>
      {visibleItems.map(({ category, depth }) => (
        <div
          key={category.id}
          className={cn(
            "flex items-center rounded-sm px-1 py-1.5 text-sm cursor-pointer hover:bg-accent/50",
            value === category.id && "bg-accent"
          )}
          style={{ paddingLeft: `${depth * 20 + 4}px` }}
          onClick={() => select(category.id)}
        >
          {hasChildren.has(category.id) ? (
            <button
              type="button"
              className="mr-1 p-0.5 rounded hover:bg-accent"
              onClick={(e) => toggleCollapse(category.id, e)}
            >
              {collapsed.has(category.id) ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="mr-1 w-[22px]" />
          )}
          {category.name}
        </div>
      ))}
    </>
  )
}

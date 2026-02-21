"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronRight, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProductCategory } from "@/hooks/use-product-categories"
import { buildProductCategoryTree } from "@/hooks/use-product-categories"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

interface CategoryTreeSelectProps {
  categories: ProductCategory[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function CategoryTreeSelect({
  categories,
  value,
  onChange,
  placeholder,
}: CategoryTreeSelectProps) {
  const t = useTranslations("products")
  const [search, setSearch] = React.useState("")
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set())

  const tree = React.useMemo(
    () => buildProductCategoryTree(categories),
    [categories]
  )

  // Build parent map for ancestor lookup
  const parentMap = React.useMemo(() => {
    const map = new Map<string, string | null>()
    for (const cat of categories) {
      map.set(cat.id, cat.parent_category_id ?? null)
    }
    return map
  }, [categories])

  // Get all ancestor IDs for a category
  const getAncestors = React.useCallback(
    (id: string): string[] => {
      const ancestors: string[] = []
      let current = parentMap.get(id) ?? null
      while (current) {
        ancestors.push(current)
        current = parentMap.get(current) ?? null
      }
      return ancestors
    },
    [parentMap]
  )

  // Filter: keep matching nodes + their ancestors
  const filteredTree = React.useMemo(() => {
    if (!search.trim()) return tree
    const lower = search.toLowerCase()
    const matchIds = new Set<string>()
    for (const { category } of tree) {
      if (category.name?.toLowerCase().includes(lower)) {
        matchIds.add(category.id)
        const ancestors = getAncestors(category.id)
        for (let i = 0; i < ancestors.length; i++) matchIds.add(ancestors[i])
      }
    }
    return tree.filter(({ category }) => matchIds.has(category.id))
  }, [tree, search, getAncestors])

  // Check if a node has children
  const hasChildren = React.useMemo(() => {
    const set = new Set<string>()
    for (const cat of categories) {
      if (cat.parent_category_id) set.add(cat.parent_category_id)
    }
    return set
  }, [categories])

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  // Hide children of collapsed nodes
  const visibleTree = React.useMemo(() => {
    const result: typeof filteredTree = []
    const hiddenParents = new Set<string>()
    for (const item of filteredTree) {
      const pid = item.category.parent_category_id ?? null
      if (pid && (hiddenParents.has(pid) || collapsed.has(pid))) {
        hiddenParents.add(item.category.id)
        continue
      }
      result.push(item)
    }
    return result
  }, [filteredTree, collapsed])

  return (
    <div className="space-y-2">
      <Popover className="w-full">
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
              "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <span className={cn(!value.length && "text-muted-foreground")}>
              {value.length > 0
                ? t("form.selectedCount", { count: value.length })
                : placeholder || t("form.selectCategory")}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("form.searchCategory")}
                className="h-9 pl-8"
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1">
            {visibleTree.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("form.noCategories")}
              </p>
            ) : (
              visibleTree.map(({ category, depth }) => (
                <div
                  key={category.id}
                  className="flex items-center rounded-sm px-1 py-1 hover:bg-accent/50"
                  style={{ paddingLeft: `${depth * 20 + 4}px` }}
                >
                  {hasChildren.has(category.id) ? (
                    <button
                      type="button"
                      className="mr-1 p-0.5 rounded hover:bg-accent"
                      onClick={() => toggleCollapse(category.id)}
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
                  <label className="flex flex-1 items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={value.includes(category.id)}
                      onChange={() => toggleSelect(category.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    {category.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((catId) => {
            const cat = categories.find((c) => c.id === catId)
            return (
              <Badge
                key={catId}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onChange(value.filter((id) => id !== catId))}
              >
                {cat?.name || catId}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

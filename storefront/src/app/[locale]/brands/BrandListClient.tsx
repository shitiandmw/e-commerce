"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Brand {
  id: string
  name: string
  description?: string | null
  logo_url?: string | null
}

export default function BrandListClient({ initialBrands }: { initialBrands: Brand[] }) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Brand[] | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    const params = new URLSearchParams({ limit: "100", q: debouncedSearch })
    fetch(`/api/brands?${params}`)
      .then((r) => r.json())
      .then((data) => setSearchResults(data?.brands || []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false))
  }, [debouncedSearch])

  const brands = searchResults ?? initialBrands

  // Group brands by first letter
  const grouped = brands.reduce<Record<string, Brand[]>>((acc, brand) => {
    const letter = brand.name.charAt(0).toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(brand)
    return acc
  }, {})
  const sortedLetters = Object.keys(grouped).sort()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">品牌</h1>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索品牌..."
          className="w-full max-w-md rounded-md border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </div>

      {searching ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-surface p-6">
              <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-surface-light" />
              <div className="mx-auto h-4 w-24 rounded bg-surface-light" />
            </div>
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg text-muted">暂无品牌</p>
          {debouncedSearch && (
            <p className="mt-1 text-sm text-muted">未找到匹配 &quot;{debouncedSearch}&quot; 的品牌</p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedLetters.map((letter) => (
            <div key={letter}>
              <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-gold">
                {letter}
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {grouped[letter].map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/brands/${brand.id}`}
                    className="group flex flex-col items-center rounded-lg border border-border bg-surface p-6 transition-colors hover:border-gold/50"
                  >
                    {brand.logo_url ? (
                      <div className="relative mb-3 h-16 w-16 overflow-hidden rounded-full bg-surface-light">
                        <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-light text-xl font-bold text-gold">
                        {brand.name.charAt(0)}
                      </div>
                    )}
                    <h3 className="text-sm font-medium text-foreground group-hover:text-gold transition-colors">
                      {brand.name}
                    </h3>
                    {brand.description && (
                      <p className="mt-1 text-xs text-muted line-clamp-2 text-center">{brand.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

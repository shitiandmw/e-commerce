"use client"

import { useEffect, useState } from "react"
import { getToken } from "@/lib/auth"
import { useTranslations } from "next-intl"
import { MapPin, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SavedAddress } from "@/hooks/use-checkout"

interface SavedAddressesProps {
  onSelect: (address: SavedAddress) => void
}

export function SavedAddresses({ onSelect }: SavedAddressesProps) {
  const t = useTranslations()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch("/api/account/addresses", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = data.addresses || []
        setAddresses(list)
      })
      .catch(() => {})
  }, [])

  if (addresses.length === 0) return null

  const handleSelect = (addr: SavedAddress) => {
    setSelectedId(addr.id)
    setShowNew(false)
    onSelect(addr)
  }

  return (
    <div className="mb-8">
      <h3 className="text-xs text-gold uppercase tracking-widest mb-4">
        {t("checkout_saved_addresses")}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {addresses.map((addr) => (
          <button
            key={addr.id}
            type="button"
            onClick={() => handleSelect(addr)}
            className={cn(
              "flex items-start gap-3 p-4 border text-left transition-colors",
              selectedId === addr.id && !showNew
                ? "border-gold/50 bg-gold/5"
                : "border-border/30 hover:border-gold/30"
            )}
          >
            <MapPin className="size-4 text-gold/60 mt-0.5 shrink-0" />
            <div className="text-xs leading-relaxed">
              <p className="text-foreground font-medium">
                {addr.first_name} {addr.last_name}
              </p>
              <p className="text-muted-foreground mt-0.5">
                {addr.address_1}
                {addr.address_2 ? `, ${addr.address_2}` : ""}
              </p>
              <p className="text-muted-foreground">
                {addr.city} {addr.postal_code}
              </p>
              <p className="text-muted-foreground uppercase">
                {addr.country_code}
              </p>
            </div>
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setSelectedId(null)
            setShowNew(true)
          }}
          className={cn(
            "flex items-center justify-center gap-2 p-4 border border-dashed transition-colors min-h-[100px]",
            showNew
              ? "border-gold/50 bg-gold/5"
              : "border-border/30 hover:border-gold/30"
          )}
        >
          <Plus className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {t("checkout_new_address")}
          </span>
        </button>
      </div>
    </div>
  )
}

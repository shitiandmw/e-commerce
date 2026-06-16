"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Clock, Loader2, MapPin, Phone } from "lucide-react"

interface PickupLocation {
  id: string
  name: string
  address: string
  phone?: string | null
  hours?: string | null
  note?: string | null
}

interface PickupLocationsResponse {
  pickup_locations: PickupLocation[]
}

interface PickupLocationsCardProps {
  descriptionKey?: string
}

export function PickupLocationsCard({
  descriptionKey = "checkout_pickup_locations_desc",
}: PickupLocationsCardProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [locations, setLocations] = useState<PickupLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadPickupLocations() {
      setLoading(true)
      setFailed(false)
      try {
        const params = new URLSearchParams()
        if (locale) params.set("locale", locale)

        const res = await fetch(`/api/pickup-locations?${params.toString()}`)
        if (!res.ok) throw new Error("Failed to load pickup locations")

        const data = (await res.json()) as PickupLocationsResponse
        if (!cancelled) setLocations(data.pickup_locations ?? [])
      } catch {
        if (!cancelled) {
          setLocations([])
          setFailed(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPickupLocations()
    return () => {
      cancelled = true
    }
  }, [locale])

  return (
    <div className="rounded-md border border-gold/20 bg-gold/5 p-4">
      <div className="mb-3 flex items-start gap-3">
        <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
        <div>
          <h3 className="text-sm font-medium text-foreground">
            {t("checkout_pickup_locations_title")}
          </h3>
          <p className="mt-1 text-xs text-foreground/70">
            {t(descriptionKey)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          {t("checkout_pickup_locations_loading")}
        </div>
      ) : failed ? (
        <p className="text-xs text-muted-foreground">
          {t("checkout_pickup_locations_unavailable")}
        </p>
      ) : locations.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("checkout_pickup_locations_empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className="rounded-sm border border-border/30 bg-background/60 p-3"
            >
              <p className="text-sm font-medium text-foreground">{location.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/75">
                {location.address}
              </p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {location.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3" />
                    <span>{location.phone}</span>
                  </div>
                )}
                {location.hours && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3" />
                    <span>{location.hours}</span>
                  </div>
                )}
              </div>
              {location.note && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {location.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

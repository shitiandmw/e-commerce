"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  useStockLocationsWithZones,
  useDeleteStockLocation,
  type StockLocationWithZones,
} from "@/hooks/use-shipping"
import { StockLocationForm } from "./stock-location-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Pencil, Trash2, Warehouse, MapPin } from "lucide-react"

export function StockLocations() {
  const t = useTranslations("shipping")
  const { data, isLoading } = useStockLocationsWithZones()
  const deleteMutation = useDeleteStockLocation()

  const [formOpen, setFormOpen] = useState(false)
  const [editLocation, setEditLocation] = useState<StockLocationWithZones | null>(null)

  const openCreate = () => {
    setEditLocation(null)
    setFormOpen(true)
  }

  const openEdit = (loc: StockLocationWithZones) => {
    setEditLocation(loc)
    setFormOpen(true)
  }

  const handleDelete = (loc: StockLocationWithZones) => {
    if (!confirm(t("locations.deleteConfirm"))) return
    deleteMutation.mutate(loc.id)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }
  /* PLACEHOLDER_REST */

  const locations = data?.stock_locations || []

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Warehouse className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("locations.title")}</h2>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("locations.addLocation")}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{t("locations.description")}</p>

      <StockLocationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editLocation={editLocation}
      />

      {locations.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("locations.noLocations")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => {
            const fsCount = loc.fulfillment_sets?.length ?? 0
            const city = loc.address?.city
            const cc = loc.address?.country_code
            return (
              <div
                key={loc.id}
                className="rounded-lg border p-4 space-y-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{loc.name}</p>
                    {(city || cc) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[city, cc?.toUpperCase()].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(loc)}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(loc)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {t("locations.fulfillmentSets", { count: fsCount })}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

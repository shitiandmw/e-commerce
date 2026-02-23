"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  useStockLocationsWithZones,
  useDeleteServiceZone,
  type ServiceZone,
  type FulfillmentSet,
} from "@/hooks/use-shipping"
import { ServiceZoneForm } from "./service-zone-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Pencil, Trash2, Globe, Warehouse } from "lucide-react"

export function ServiceZones() {
  const t = useTranslations("shipping")
  const { data, isLoading } = useStockLocationsWithZones()

  const [formOpen, setFormOpen] = useState(false)
  const [editZone, setEditZone] = useState<ServiceZone | null>(null)
  const [editFsId, setEditFsId] = useState("")

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const locations = data?.stock_locations || []
  const allFulfillmentSets: FulfillmentSet[] = locations.flatMap(
    (loc) => loc.fulfillment_sets || []
  )

  const openCreate = () => {
    setEditZone(null)
    setEditFsId("")
    setFormOpen(true)
  }

  const openEdit = (zone: ServiceZone, fsId: string) => {
    setEditZone(zone)
    setEditFsId(fsId)
    setFormOpen(true)
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("zones.title")}</h2>
        </div>
        {allFulfillmentSets.length > 0 && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("zones.addZone")}
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{t("zones.description")}</p>

      <ServiceZoneForm
        open={formOpen}
        onOpenChange={setFormOpen}
        fulfillmentSets={allFulfillmentSets}
        editZone={editZone}
        editFulfillmentSetId={editFsId}
      />

      {allFulfillmentSets.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("zones.noFulfillmentSets")}
        </div>
      ) : (
        <div className="space-y-6">
          {locations.map((loc) =>
            (loc.fulfillment_sets || []).map((fs) => (
              <div key={fs.id} className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Warehouse className="h-4 w-4" />
                  <span>{loc.name}</span>
                  <span className="text-xs">→</span>
                  <Badge variant="outline">{fs.name} ({fs.type})</Badge>
                </div>

                {(fs.service_zones || []).length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground ml-6">
                    {t("zones.noZones")}
                  </div>
                ) : (
                  <div className="space-y-2 ml-6">
                    {fs.service_zones.map((zone) => (
                      <ZoneCard
                        key={zone.id}
                        zone={zone}
                        fulfillmentSetId={fs.id}
                        onEdit={() => openEdit(zone, fs.id)}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ZoneCard({
  zone,
  fulfillmentSetId,
  onEdit,
  t,
}: {
  zone: ServiceZone
  fulfillmentSetId: string
  onEdit: () => void
  t: ReturnType<typeof useTranslations<"shipping">>
}) {
  const deleteZone = useDeleteServiceZone(fulfillmentSetId)

  const handleDelete = () => {
    if (!confirm(t("zones.deleteConfirm"))) return
    deleteZone.mutate(zone.id)
  }

  return (
    <div className="flex items-center justify-between rounded-md border p-4">
      <div className="space-y-1.5">
        <span className="font-medium text-sm">{zone.name}</span>
        <div className="flex flex-wrap gap-1">
          {zone.geo_zones.map((g) => (
            <Badge key={g.id} variant="secondary" className="text-xs uppercase">
              {g.country_code}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleteZone.isPending}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

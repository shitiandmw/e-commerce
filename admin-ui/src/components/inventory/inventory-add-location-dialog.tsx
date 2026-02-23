"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  useCreateInventoryLevel,
  useStockLocations,
  type InventoryItem,
} from "@/hooks/use-inventory"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

interface InventoryAddLocationDialogProps {
  item: InventoryItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InventoryAddLocationDialog({
  item,
  open,
  onOpenChange,
}: InventoryAddLocationDialogProps) {
  const t = useTranslations("inventory")
  const { data: locationsData } = useStockLocations()
  const createLevel = useCreateInventoryLevel(item.id)

  const [locationId, setLocationId] = useState("")
  const [stockedQty, setStockedQty] = useState(0)
  const [incomingQty, setIncomingQty] = useState(0)
  const [error, setError] = useState("")

  const existingLocationIds = new Set(
    item.location_levels?.map((l) => l.location_id) ?? []
  )
  const availableLocations = (locationsData?.stock_locations ?? []).filter(
    (loc) => !existingLocationIds.has(loc.id)
  )

  const handleSubmit = async () => {
    setError("")
    if (!locationId) {
      setError(t("addLocation.errors.selectLocation"))
      return
    }
    if (stockedQty < 0) {
      setError(t("addLocation.errors.invalidQuantity"))
      return
    }
    try {
      await createLevel.mutateAsync({
        location_id: locationId,
        stocked_quantity: stockedQty,
        ...(incomingQty > 0 ? { incoming_quantity: incomingQty } : {}),
      })
      setLocationId("")
      setStockedQty(0)
      setIncomingQty(0)
      onOpenChange(false)
    } catch {
      setError(t("addLocation.errors.createFailed"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addLocation.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("addLocation.location")}</Label>
            {availableLocations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("addLocation.noAvailableLocations")}
              </p>
            ) : (
              <Select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <option value="">{t("addLocation.selectLocation")}</option>
                {availableLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("addLocation.stockedQuantity")}</Label>
            <Input
              type="number"
              min={0}
              value={stockedQty}
              onChange={(e) => setStockedQty(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>
              {t("addLocation.incomingQuantity")}{" "}
              <span className="text-muted-foreground text-xs">{t("adjustDialog.optional")}</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={incomingQty}
              onChange={(e) => setIncomingQty(Number(e.target.value))}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("adjustDialog.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createLevel.isPending || availableLocations.length === 0}
            >
              {createLevel.isPending ? t("addLocation.adding") : t("addLocation.add")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

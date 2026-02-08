"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Minus, Plus } from "lucide-react"
import {
  InventoryItem,
  InventoryLevel,
  StockLocation,
  useUpdateInventoryLevel,
  useStockLocations,
} from "@/hooks/use-inventory"

interface InventoryAdjustDialogProps {
  item: InventoryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-select a specific location level */
  preselectedLocationId?: string
}

export function InventoryAdjustDialog({
  item,
  open,
  onOpenChange,
  preselectedLocationId,
}: InventoryAdjustDialogProps) {
  const t = useTranslations("inventory")
  const { data: locationsData } = useStockLocations()
  const updateLevel = useUpdateInventoryLevel(item?.id || "")

  const [selectedLocationId, setSelectedLocationId] = React.useState<string>("")
  const [adjustmentType, setAdjustmentType] = React.useState<"set" | "add" | "remove">("set")
  const [quantity, setQuantity] = React.useState<string>("")
  const [incomingQuantity, setIncomingQuantity] = React.useState<string>("")
  const [error, setError] = React.useState<string | null>(null)

  const locations = locationsData?.stock_locations ?? []

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open && item) {
      setError(null)
      setQuantity("")
      setIncomingQuantity("")
      setAdjustmentType("set")

      if (preselectedLocationId) {
        setSelectedLocationId(preselectedLocationId)
      } else if (item.location_levels && item.location_levels.length > 0) {
        setSelectedLocationId(item.location_levels[0].location_id)
      } else {
        setSelectedLocationId("")
      }
    }
  }, [open, item, preselectedLocationId])

  if (!item) return null

  const selectedLevel = item.location_levels?.find(
    (l) => l.location_id === selectedLocationId
  )
  const selectedLocation = locations.find((l) => l.id === selectedLocationId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedLocationId) {
      setError(t("adjustDialog.errors.selectLocation"))
      return
    }

    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty < 0) {
      setError(t("adjustDialog.errors.invalidQuantity"))
      return
    }

    let newStockedQuantity: number

    if (adjustmentType === "set") {
      newStockedQuantity = qty
    } else if (adjustmentType === "add") {
      newStockedQuantity = (selectedLevel?.stocked_quantity || 0) + qty
    } else {
      // remove
      newStockedQuantity = Math.max(0, (selectedLevel?.stocked_quantity || 0) - qty)
    }

    const payload: {
      locationId: string
      stocked_quantity?: number
      incoming_quantity?: number
    } = {
      locationId: selectedLocationId,
      stocked_quantity: newStockedQuantity,
    }

    if (incomingQuantity !== "") {
      const inc = parseInt(incomingQuantity, 10)
      if (!isNaN(inc) && inc >= 0) {
        payload.incoming_quantity = inc
      }
    }

    try {
      await updateLevel.mutateAsync(payload)
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("adjustDialog.errors.updateFailed")
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("adjustDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("adjustDialog.description", { name: item.sku || item.title || item.id })}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Location selector */}
            <div className="space-y-2">
              <Label>{t("adjustDialog.stockLocation")}</Label>
              {item.location_levels && item.location_levels.length > 0 ? (
                <Select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                >
                  <option value="">{t("adjustDialog.selectLocation")}</option>
                  {item.location_levels.map((level) => {
                    const loc = locations.find((l) => l.id === level.location_id)
                    return (
                      <option key={level.location_id} value={level.location_id}>
                        {loc?.name || level.location_id} ({t("adjustDialog.currentLabel", { count: level.stocked_quantity })})
                      </option>
                    )
                  })}
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("adjustDialog.noLocations")}
                </p>
              )}
            </div>

            {/* Current levels display */}
            {selectedLevel && (
              <div className="rounded-md bg-muted p-3 space-y-1.5">
                <p className="text-sm font-medium">
                  {t("adjustDialog.currentLevels", { location: selectedLocation?.name || selectedLocationId })}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("adjustDialog.stocked")}</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {selectedLevel.stocked_quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("adjustDialog.reserved")}</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {selectedLevel.reserved_quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("adjustDialog.available")}</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {selectedLevel.available_quantity}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Adjustment type */}
            <div className="space-y-2">
              <Label>{t("adjustDialog.adjustmentType")}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={adjustmentType === "set" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAdjustmentType("set")}
                >
                  {t("adjustDialog.setTo")}
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === "add" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAdjustmentType("add")}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {t("adjustDialog.add")}
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === "remove" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAdjustmentType("remove")}
                  className="gap-1"
                >
                  <Minus className="h-3 w-3" />
                  {t("adjustDialog.remove")}
                </Button>
              </div>
            </div>

            {/* Quantity input */}
            <div className="space-y-2">
              <Label htmlFor="adjust-quantity">
                {adjustmentType === "set"
                  ? t("adjustDialog.quantityLabels.set")
                  : adjustmentType === "add"
                  ? t("adjustDialog.quantityLabels.add")
                  : t("adjustDialog.quantityLabels.remove")}
              </Label>
              <Input
                id="adjust-quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Incoming quantity */}
            <div className="space-y-2">
              <Label htmlFor="incoming-quantity">
                {t("adjustDialog.incomingQuantity")}{" "}
                <span className="text-muted-foreground font-normal">{t("adjustDialog.optional")}</span>
              </Label>
              <Input
                id="incoming-quantity"
                type="number"
                min="0"
                value={incomingQuantity}
                onChange={(e) => setIncomingQuantity(e.target.value)}
                placeholder={
                  selectedLevel
                    ? String(selectedLevel.incoming_quantity)
                    : "0"
                }
              />
            </div>

            {/* Preview */}
            {selectedLevel && quantity !== "" && (
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground mb-1">{t("adjustDialog.preview")}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="tabular-nums">
                    {selectedLevel.stocked_quantity}
                  </Badge>
                  <span className="text-muted-foreground">&rarr;</span>
                  <Badge variant="secondary" className="tabular-nums font-semibold">
                    {adjustmentType === "set"
                      ? parseInt(quantity, 10) || 0
                      : adjustmentType === "add"
                      ? (selectedLevel.stocked_quantity || 0) + (parseInt(quantity, 10) || 0)
                      : Math.max(0, (selectedLevel.stocked_quantity || 0) - (parseInt(quantity, 10) || 0))}
                  </Badge>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("adjustDialog.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateLevel.isPending || !selectedLocationId}
            >
              {updateLevel.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("adjustDialog.updating")}
                </>
              ) : (
                t("adjustDialog.updateStock")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

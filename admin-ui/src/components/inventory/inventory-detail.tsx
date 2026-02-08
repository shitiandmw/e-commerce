"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import {
  useInventoryItem,
  useStockLocations,
  InventoryItem,
  InventoryLevel,
  getStockStatus,
  getTotalStocked,
  getTotalReserved,
  getTotalAvailable,
  getTotalIncoming,
  LOW_STOCK_THRESHOLD,
} from "@/hooks/use-inventory"
import { InventoryAdjustDialog } from "./inventory-adjust-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Warehouse,
  Package,
  PenLine,
  AlertTriangle,
  MapPin,
  ArrowDownToLine,
  Lock,
  Boxes,
  TrendingUp,
} from "lucide-react"

interface InventoryDetailProps {
  inventoryItemId: string
}

export function InventoryDetail({ inventoryItemId }: InventoryDetailProps) {
  const t = useTranslations("inventory")
  const { data, isLoading, isError, error } = useInventoryItem(inventoryItemId)
  const { data: locationsData } = useStockLocations()
  const [adjustOpen, setAdjustOpen] = React.useState(false)
  const [adjustLocationId, setAdjustLocationId] = React.useState<string | undefined>()

  const item = data?.inventory_item
  const locations = locationsData?.stock_locations ?? []

  const getLocationName = (locationId: string) => {
    const loc = locations.find((l) => l.id === locationId)
    return loc?.name || locationId
  }

  const handleAdjustAtLocation = (locationId: string) => {
    setAdjustLocationId(locationId)
    setAdjustOpen(true)
  }

  function getStockBadge(item: InventoryItem) {
    const status = getStockStatus(item)
    switch (status) {
      case "in_stock":
        return <Badge variant="success">{t("status.inStock")}</Badge>
      case "low_stock":
        return (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t("status.lowStock")}
          </Badge>
        )
      case "out_of_stock":
        return <Badge variant="destructive">{t("status.outOfStock")}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (isError || !item) {
    return (
      <div className="space-y-6">
        <Link href="/inventory">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("detail.backToInventory")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("detail.itemNotFound")}
          </p>
        </div>
      </div>
    )
  }

  const totalStocked = getTotalStocked(item)
  const totalReserved = getTotalReserved(item)
  const totalAvailable = getTotalAvailable(item)
  const totalIncoming = getTotalIncoming(item)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {item.title || item.sku || t("detail.inventoryItem")}
              </h1>
              {getStockBadge(item)}
            </div>
            {item.sku && (
              <p className="text-muted-foreground mt-1 font-mono text-sm">
                SKU: {item.sku}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={() => {
            setAdjustLocationId(undefined)
            setAdjustOpen(true)
          }}
        >
          <PenLine className="mr-2 h-4 w-4" />
          {t("detail.adjustStock")}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Boxes className="h-4 w-4" />
            <p className="text-sm font-medium">{t("detail.summary.totalStocked")}</p>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">{totalStocked}</p>
        </div>
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <p className="text-sm font-medium">{t("detail.summary.reserved")}</p>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-muted-foreground">
            {totalReserved}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <p className="text-sm font-medium">{t("detail.summary.available")}</p>
          </div>
          <p
            className={`mt-2 text-3xl font-bold tabular-nums ${
              totalAvailable <= 0
                ? "text-destructive"
                : totalAvailable <= LOW_STOCK_THRESHOLD
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {totalAvailable}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowDownToLine className="h-4 w-4" />
            <p className="text-sm font-medium">{t("detail.summary.incoming")}</p>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {totalIncoming > 0 ? `+${totalIncoming}` : "0"}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Location Levels */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("detail.stockByLocation")}
              </h2>
              <Badge variant="secondary">
                {t("table.locationsCount", { count: item.location_levels?.length || 0 })}
              </Badge>
            </div>

            {!item.location_levels || item.location_levels.length === 0 ? (
              <div className="text-center py-8">
                <Warehouse className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("detail.noStockLocations")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {item.location_levels.map((level) => {
                  const isLow =
                    level.available_quantity > 0 &&
                    level.available_quantity <= LOW_STOCK_THRESHOLD
                  const isOut = level.available_quantity <= 0
                  return (
                    <div
                      key={level.id}
                      className="rounded-md border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">
                            {getLocationName(level.location_id)}
                          </p>
                          {isOut && (
                            <Badge variant="destructive" className="text-xs">
                              {t("status.outOfStock")}
                            </Badge>
                          )}
                          {isLow && !isOut && (
                            <Badge variant="warning" className="text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {t("detail.low")}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleAdjustAtLocation(level.location_id)
                          }
                        >
                          <PenLine className="mr-1.5 h-3 w-3" />
                          {t("detail.adjust")}
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center rounded-md bg-muted p-2.5">
                          <p className="text-xs text-muted-foreground">
                            {t("detail.locationLevels.stocked")}
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {level.stocked_quantity}
                          </p>
                        </div>
                        <div className="text-center rounded-md bg-muted p-2.5">
                          <p className="text-xs text-muted-foreground">
                            {t("detail.locationLevels.reserved")}
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {level.reserved_quantity}
                          </p>
                        </div>
                        <div className="text-center rounded-md bg-muted p-2.5">
                          <p className="text-xs text-muted-foreground">
                            {t("detail.locationLevels.available")}
                          </p>
                          <p
                            className={`text-sm font-semibold tabular-nums ${
                              isOut
                                ? "text-destructive"
                                : isLow
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            {level.available_quantity}
                          </p>
                        </div>
                        <div className="text-center rounded-md bg-muted p-2.5">
                          <p className="text-xs text-muted-foreground">
                            {t("detail.locationLevels.incoming")}
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {level.incoming_quantity > 0
                              ? `+${level.incoming_quantity}`
                              : "0"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Low Stock Alert */}
          {item.location_levels?.some(
            (l) => l.available_quantity <= LOW_STOCK_THRESHOLD
          ) && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h2 className="text-lg font-semibold text-yellow-800">
                  {t("detail.alert.title")}
                </h2>
              </div>
              <div className="space-y-2">
                {item.location_levels
                  ?.filter((l) => l.available_quantity <= LOW_STOCK_THRESHOLD)
                  .map((level) => (
                    <div
                      key={level.id}
                      className="flex items-center justify-between rounded-md bg-white/80 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-yellow-900">
                          {getLocationName(level.location_id)}
                        </p>
                        <p className="text-xs text-yellow-700">
                          {level.available_quantity <= 0
                            ? t("detail.alert.outOfStock")
                            : t("detail.alert.unitsAvailable", { count: level.available_quantity, threshold: LOW_STOCK_THRESHOLD })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                        onClick={() =>
                          handleAdjustAtLocation(level.location_id)
                        }
                      >
                        {t("detail.alert.restock")}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Item Details */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("detail.itemDetails.title")}</h2>
            <div className="space-y-3">
              {item.sku && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("detail.itemDetails.sku")}</span>
                  <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
                    {item.sku}
                  </code>
                </div>
              )}
              {item.title && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("detail.itemDetails.itemTitle")}</span>
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.itemDetails.requiresShipping")}
                </span>
                <Badge variant={item.requires_shipping ? "secondary" : "outline"}>
                  {item.requires_shipping ? t("detail.itemDetails.yes") : t("detail.itemDetails.no")}
                </Badge>
              </div>
              {item.origin_country && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("detail.itemDetails.originCountry")}
                  </span>
                  <span className="text-sm uppercase">{item.origin_country}</span>
                </div>
              )}
              {item.material && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("detail.itemDetails.material")}
                  </span>
                  <span className="text-sm">{item.material}</span>
                </div>
              )}
              {item.hs_code && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("detail.itemDetails.hsCode")}
                  </span>
                  <code className="text-sm bg-muted px-2 py-0.5 rounded">
                    {item.hs_code}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Dimensions */}
          {(item.weight || item.length || item.width || item.height) && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold">{t("detail.dimensions.title")}</h2>
              <div className="grid grid-cols-2 gap-3">
                {item.weight != null && (
                  <div className="text-center rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">{t("detail.dimensions.weight")}</p>
                    <p className="font-medium">{item.weight}g</p>
                  </div>
                )}
                {item.length != null && (
                  <div className="text-center rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">{t("detail.dimensions.length")}</p>
                    <p className="font-medium">{item.length}mm</p>
                  </div>
                )}
                {item.width != null && (
                  <div className="text-center rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">{t("detail.dimensions.width")}</p>
                    <p className="font-medium">{item.width}mm</p>
                  </div>
                )}
                {item.height != null && (
                  <div className="text-center rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">{t("detail.dimensions.height")}</p>
                    <p className="font-medium">{item.height}mm</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Item ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("detail.inventoryItemId")}
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {item.id}
            </code>
          </div>
        </div>
      </div>

      {/* Adjust Dialog */}
      <InventoryAdjustDialog
        item={item}
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        preselectedLocationId={adjustLocationId}
      />
    </div>
  )
}

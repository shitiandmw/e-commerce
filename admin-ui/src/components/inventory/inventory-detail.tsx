"use client"

import * as React from "react"
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

function getStockBadge(item: InventoryItem) {
  const status = getStockStatus(item)
  switch (status) {
    case "in_stock":
      return <Badge variant="success">In Stock</Badge>
    case "low_stock":
      return (
        <Badge variant="warning" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      )
    case "out_of_stock":
      return <Badge variant="destructive">Out of Stock</Badge>
  }
}

interface InventoryDetailProps {
  inventoryItemId: string
}

export function InventoryDetail({ inventoryItemId }: InventoryDetailProps) {
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
            Back to Inventory
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : "Inventory item not found or failed to load."}
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
                {item.title || item.sku || "Inventory Item"}
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
          Adjust Stock
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Boxes className="h-4 w-4" />
            <p className="text-sm font-medium">Total Stocked</p>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">{totalStocked}</p>
        </div>
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <p className="text-sm font-medium">Reserved</p>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-muted-foreground">
            {totalReserved}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <p className="text-sm font-medium">Available</p>
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
            <p className="text-sm font-medium">Incoming</p>
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
                Stock by Location
              </h2>
              <Badge variant="secondary">
                {item.location_levels?.length || 0} locations
              </Badge>
            </div>

            {!item.location_levels || item.location_levels.length === 0 ? (
              <div className="text-center py-8">
                <Warehouse className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No stock locations assigned.
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
                              Out of Stock
                            </Badge>
                          )}
                          {isLow && !isOut && (
                            <Badge variant="warning" className="text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Low
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
                          Adjust
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center rounded-md bg-muted p-2.5">
                          <p className="text-xs text-muted-foreground">
                            Stocked
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {level.stocked_quantity}
                          </p>
                        </div>
                        <div className="text-center rounded-md bg-muted p-2.5">
                          <p className="text-xs text-muted-foreground">
                            Reserved
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {level.reserved_quantity}
                          </p>
                        </div>
                        <div className="text-center rounded-md bg-muted p-2.5">
                          <p className="text-xs text-muted-foreground">
                            Available
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
                            Incoming
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
                  Inventory Alert
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
                            ? "Out of stock"
                            : `Only ${level.available_quantity} units available (threshold: ${LOW_STOCK_THRESHOLD})`}
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
                        Restock
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
            <h2 className="text-lg font-semibold">Item Details</h2>
            <div className="space-y-3">
              {item.sku && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">SKU</span>
                  <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
                    {item.sku}
                  </code>
                </div>
              )}
              {item.title && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Title</span>
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Requires Shipping
                </span>
                <Badge variant={item.requires_shipping ? "secondary" : "outline"}>
                  {item.requires_shipping ? "Yes" : "No"}
                </Badge>
              </div>
              {item.origin_country && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Origin Country
                  </span>
                  <span className="text-sm uppercase">{item.origin_country}</span>
                </div>
              )}
              {item.material && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Material
                  </span>
                  <span className="text-sm">{item.material}</span>
                </div>
              )}
              {item.hs_code && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    HS Code
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
              <h2 className="text-lg font-semibold">Dimensions</h2>
              <div className="grid grid-cols-2 gap-3">
                {item.weight != null && (
                  <div className="text-center rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="font-medium">{item.weight}g</p>
                  </div>
                )}
                {item.length != null && (
                  <div className="text-center rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Length</p>
                    <p className="font-medium">{item.length}mm</p>
                  </div>
                )}
                {item.width != null && (
                  <div className="text-center rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Width</p>
                    <p className="font-medium">{item.width}mm</p>
                  </div>
                )}
                {item.height != null && (
                  <div className="text-center rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Height</p>
                    <p className="font-medium">{item.height}mm</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Item ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Inventory Item ID
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

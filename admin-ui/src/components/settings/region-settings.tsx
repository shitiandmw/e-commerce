"use client"

import * as React from "react"
import {
  useRegions,
  useCreateRegion,
  useUpdateRegion,
  useDeleteRegion,
  useCurrencies,
  type AdminRegion,
} from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Globe,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react"

export function RegionSettings() {
  const { data, isLoading } = useRegions()
  const { data: currenciesData } = useCurrencies()
  const createRegion = useCreateRegion()
  const deleteRegion = useDeleteRegion()

  const [showCreate, setShowCreate] = React.useState(false)
  const [editRegion, setEditRegion] = React.useState<AdminRegion | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const regions = data?.regions || []
  const currencies = currenciesData?.currencies || []

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteRegion.mutateAsync(deleteId)
      setDeleteId(null)
    } catch {
      // Error shown in mutation state
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Sales Regions</h2>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Region
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage the regions where your store operates. Each region defines a currency and applicable countries.
        </p>

        {regions.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No regions configured yet. Add your first region to start selling.
          </div>
        ) : (
          <div className="space-y-3">
            {regions.map((region) => (
              <div
                key={region.id}
                className="flex items-start justify-between rounded-md border p-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{region.name}</span>
                    <Badge variant="secondary">
                      {region.currency_code.toUpperCase()}
                    </Badge>
                    {region.automatic_taxes && (
                      <Badge variant="outline">Auto Tax</Badge>
                    )}
                  </div>
                  {region.countries && region.countries.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {region.countries.map((c) => (
                        <span
                          key={c.iso_2}
                          className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs"
                        >
                          {c.display_name || c.name || c.iso_2.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {region.payment_providers && region.payment_providers.length > 0
                      ? `${region.payment_providers.length} payment provider(s)`
                      : "No payment providers"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditRegion(region)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(region.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <RegionFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        currencies={currencies}
        mode="create"
      />

      {/* Edit Dialog */}
      {editRegion && (
        <RegionFormDialog
          open={!!editRegion}
          onOpenChange={(open) => !open && setEditRegion(null)}
          currencies={currencies}
          mode="edit"
          region={editRegion}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent onClose={() => setDeleteId(null)}>
          <DialogHeader>
            <DialogTitle>Delete Region</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete this region? This action cannot be undone.
          </p>
          {deleteRegion.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {deleteRegion.error instanceof Error
                ? deleteRegion.error.message
                : "Failed to delete region"}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteRegion.isPending}
            >
              {deleteRegion.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---- Region Form Dialog ----

interface RegionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currencies: Array<{ code: string; name: string }>
  mode: "create" | "edit"
  region?: AdminRegion
}

function RegionFormDialog({
  open,
  onOpenChange,
  currencies,
  mode,
  region,
}: RegionFormDialogProps) {
  const createRegion = useCreateRegion()
  const updateRegion = useUpdateRegion(region?.id || "")

  const [name, setName] = React.useState(region?.name || "")
  const [currencyCode, setCurrencyCode] = React.useState(
    region?.currency_code || "usd"
  )
  const [countriesInput, setCountriesInput] = React.useState(
    region?.countries?.map((c) => c.iso_2).join(", ") || ""
  )

  React.useEffect(() => {
    if (region) {
      setName(region.name)
      setCurrencyCode(region.currency_code)
      setCountriesInput(region.countries?.map((c) => c.iso_2).join(", ") || "")
    } else {
      setName("")
      setCurrencyCode("usd")
      setCountriesInput("")
    }
  }, [region, open])

  const handleSubmit = async () => {
    const countries = countriesInput
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    try {
      if (mode === "create") {
        await createRegion.mutateAsync({
          name,
          currency_code: currencyCode,
          countries,
        })
      } else {
        await updateRegion.mutateAsync({
          name,
          currency_code: currencyCode,
          countries,
        })
      }
      onOpenChange(false)
    } catch {
      // Error shown in dialog
    }
  }

  const isPending =
    mode === "create" ? createRegion.isPending : updateRegion.isPending
  const error = mode === "create" ? createRegion.error : updateRegion.error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Region" : "Edit Region"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="region-name">Name</Label>
            <Input
              id="region-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North America"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region-currency">Currency</Label>
            <Select
              id="region-currency"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
            >
              {currencies.length > 0 ? (
                currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code.toUpperCase()} - {c.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="usd">USD - US Dollar</option>
                  <option value="eur">EUR - Euro</option>
                  <option value="gbp">GBP - British Pound</option>
                  <option value="cny">CNY - Chinese Yuan</option>
                  <option value="jpy">JPY - Japanese Yen</option>
                </>
              )}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="region-countries">
              Countries{" "}
              <span className="text-muted-foreground font-normal">
                (comma-separated ISO codes)
              </span>
            </Label>
            <Input
              id="region-countries"
              value={countriesInput}
              onChange={(e) => setCountriesInput(e.target.value)}
              placeholder="e.g. us, ca, mx"
            />
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error instanceof Error ? error.message : "An error occurred"}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

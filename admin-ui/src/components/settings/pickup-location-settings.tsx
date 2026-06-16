"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  PickupLocation,
  useCreatePickupLocation,
  useDeletePickupLocation,
  usePickupLocations,
  useUpdatePickupLocation,
} from "@/hooks/use-pickup-locations"
import { adminFetch } from "@/lib/admin-api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

const pickupLocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional(),
  hours: z.string().optional(),
  note: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_enabled: z.boolean().default(true),
})

type PickupLocationFormData = z.infer<typeof pickupLocationSchema>

const SORT_ORDER_STEP = 10

function comparePickupLocations(a: PickupLocation, b: PickupLocation) {
  const sortDiff = a.sort_order - b.sort_order
  if (sortDiff !== 0) return sortDiff

  const createdDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  if (createdDiff !== 0 && Number.isFinite(createdDiff)) return createdDiff

  return a.id.localeCompare(b.id)
}

function getNextSortOrder(locations: PickupLocation[]) {
  const maxSortOrder = locations.reduce(
    (max, location) => Math.max(max, location.sort_order),
    0
  )

  return maxSortOrder + SORT_ORDER_STEP
}

function toFormValues(
  location?: PickupLocation | null,
  defaultSortOrder = SORT_ORDER_STEP
): PickupLocationFormData {
  return location
    ? {
        name: location.name,
        address: location.address,
        phone: location.phone || "",
        hours: location.hours || "",
        note: location.note || "",
        sort_order: location.sort_order,
        is_enabled: location.is_enabled,
      }
    : {
        name: "",
        address: "",
        phone: "",
        hours: "",
        note: "",
        sort_order: defaultSortOrder,
        is_enabled: true,
      }
}

function truncate(value: string, maxLength = 80) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}...`
}

export function PickupLocationSettings() {
  const t = useTranslations("settings")
  const { data, isLoading, isError, error } = usePickupLocations()
  const deletePickupLocation = useDeletePickupLocation()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingLocation, setEditingLocation] = React.useState<PickupLocation | null>(null)
  const [deletingLocation, setDeletingLocation] = React.useState<PickupLocation | null>(null)

  const pickupLocations = React.useMemo(() => {
    return [...(data?.pickup_locations || [])].sort(comparePickupLocations)
  }, [data?.pickup_locations])

  const nextSortOrder = React.useMemo(
    () => getNextSortOrder(pickupLocations),
    [pickupLocations]
  )

  const handleCreate = () => {
    setEditingLocation(null)
    setFormOpen(true)
  }

  const handleEdit = (location: PickupLocation) => {
    setEditingLocation(location)
    setFormOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingLocation) return
    try {
      await deletePickupLocation.mutateAsync(deletingLocation.id)
      setDeletingLocation(null)
    } catch {
      // Mutation error is displayed below.
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">{t("pickupLocations.title")}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{t("pickupLocations.description")}</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("pickupLocations.add")}
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">{t("pickupLocations.columns.sort")}</TableHead>
                <TableHead>{t("pickupLocations.columns.name")}</TableHead>
                <TableHead>{t("pickupLocations.columns.address")}</TableHead>
                <TableHead className="w-[160px]">{t("pickupLocations.columns.hours")}</TableHead>
                <TableHead className="w-[140px]">{t("pickupLocations.columns.phone")}</TableHead>
                <TableHead className="w-[90px] text-center">{t("pickupLocations.columns.enabled")}</TableHead>
                <TableHead className="w-[120px] text-center">{t("pickupLocations.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-8 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="mx-auto h-5 w-9" /></TableCell>
                    <TableCell><Skeleton className="mx-auto h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="text-destructive">
                      {t("pickupLocations.errorLoading")}:{" "}
                      {error instanceof Error ? error.message : t("pickupLocations.unknownError")}
                    </div>
                  </TableCell>
                </TableRow>
              ) : pickupLocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {t("pickupLocations.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                pickupLocations.map((location, index) => (
                  <PickupLocationRow
                    key={location.id}
                    location={location}
                    locations={pickupLocations}
                    index={index}
                    onEdit={handleEdit}
                    onDelete={setDeletingLocation}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <PickupLocationForm
        location={editingLocation}
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultSortOrder={nextSortOrder}
      />

      <Dialog
        open={!!deletingLocation}
        onOpenChange={(open) => {
          if (!open) setDeletingLocation(null)
        }}
      >
        <DialogContent onClose={() => setDeletingLocation(null)}>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 sm:mx-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="mt-4">{t("pickupLocations.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("pickupLocations.deleteDescription", {
                name: deletingLocation?.name || "",
              })}
            </DialogDescription>
          </DialogHeader>
          {deletePickupLocation.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {deletePickupLocation.error instanceof Error
                ? deletePickupLocation.error.message
                : t("pickupLocations.errorOccurred")}
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setDeletingLocation(null)}
              disabled={deletePickupLocation.isPending}
            >
              {t("pickupLocations.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletePickupLocation.isPending}
            >
              {deletePickupLocation.isPending
                ? t("pickupLocations.deleting")
                : t("pickupLocations.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PickupLocationRow({
  location,
  locations,
  index,
  onEdit,
  onDelete,
}: {
  location: PickupLocation
  locations: PickupLocation[]
  index: number
  onEdit: (location: PickupLocation) => void
  onDelete: (location: PickupLocation) => void
}) {
  const t = useTranslations("settings")
  const queryClient = useQueryClient()
  const updatePickupLocation = useUpdatePickupLocation(location.id)
  const [isReordering, setIsReordering] = React.useState(false)
  const isFirst = index === 0
  const isLast = index === locations.length - 1

  const handleToggleEnabled = async (checked: boolean) => {
    await updatePickupLocation.mutateAsync({ is_enabled: checked })
  }

  const moveLocation = async (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= locations.length) return

    const reordered = [...locations]
    const [movedLocation] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, movedLocation)

    const updates = reordered
      .map((item, orderIndex) => ({
        id: item.id,
        sort_order: (orderIndex + 1) * SORT_ORDER_STEP,
      }))
      .filter((item) => {
        const existing = locations.find((location) => location.id === item.id)
        return existing?.sort_order !== item.sort_order
      })

    if (updates.length === 0) return

    setIsReordering(true)
    try {
      await Promise.all(
        updates.map((item) =>
          adminFetch(`/admin/pickup-locations/${item.id}`, {
            method: "POST",
            body: { sort_order: item.sort_order },
          })
        )
      )
      await queryClient.invalidateQueries({ queryKey: ["pickup-locations"] })
    } finally {
      setIsReordering(false)
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={isFirst || isReordering || updatePickupLocation.isPending}
            onClick={() => moveLocation(index - 1)}
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground">{location.sort_order}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={isLast || isReordering || updatePickupLocation.isPending}
            onClick={() => moveLocation(index + 1)}
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="text-sm font-medium">{location.name}</p>
          {location.note && (
            <p className="text-xs text-muted-foreground" title={location.note}>
              {truncate(location.note, 50)}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm" title={location.address}>
          {truncate(location.address)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{location.hours || "-"}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{location.phone || "-"}</span>
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={location.is_enabled}
          onCheckedChange={handleToggleEnabled}
          disabled={updatePickupLocation.isPending}
          aria-label={t("pickupLocations.columns.enabled")}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(location)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(location)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function PickupLocationForm({
  location,
  open,
  onOpenChange,
  defaultSortOrder,
}: {
  location?: PickupLocation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultSortOrder?: number
}) {
  const t = useTranslations("settings")
  const isEdit = !!location
  const createPickupLocation = useCreatePickupLocation()
  const updatePickupLocation = useUpdatePickupLocation(location?.id || "")

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<PickupLocationFormData>({
    resolver: zodResolver(pickupLocationSchema),
    defaultValues: toFormValues(location, defaultSortOrder),
  })

  const previousOpenRef = React.useRef(false)
  const previousLocationIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    const locationId = location?.id ?? null
    const shouldReset =
      open && (!previousOpenRef.current || previousLocationIdRef.current !== locationId)

    if (shouldReset) {
      reset(toFormValues(location, defaultSortOrder))
    }

    previousOpenRef.current = open
    previousLocationIdRef.current = locationId
  }, [defaultSortOrder, location, open, reset])

  const onSubmit = async (data: PickupLocationFormData) => {
    const payload: {
      name: string
      address: string
      phone: string | null
      hours: string | null
      note: string | null
      sort_order?: number
      is_enabled: boolean
    } = {
      name: data.name.trim(),
      address: data.address.trim(),
      phone: data.phone?.trim() || null,
      hours: data.hours?.trim() || null,
      note: data.note?.trim() || null,
      is_enabled: data.is_enabled,
    }

    if (isEdit || dirtyFields.sort_order) {
      payload.sort_order = data.sort_order
    }

    try {
      if (isEdit) {
        await updatePickupLocation.mutateAsync(payload)
      } else {
        await createPickupLocation.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch {
      // Error is shown below.
    }
  }

  const mutationError = isEdit ? updatePickupLocation.error : createPickupLocation.error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("pickupLocations.editTitle") : t("pickupLocations.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("pickupLocations.editDescription") : t("pickupLocations.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {mutationError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {mutationError instanceof Error
                ? mutationError.message
                : t("pickupLocations.errorOccurred")}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pickup-name">{t("pickupLocations.form.name")}</Label>
            <Input
              id="pickup-name"
              {...register("name")}
              placeholder={t("pickupLocations.form.namePlaceholder")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{t("pickupLocations.form.nameRequired")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup-address">{t("pickupLocations.form.address")}</Label>
            <Textarea
              id="pickup-address"
              {...register("address")}
              placeholder={t("pickupLocations.form.addressPlaceholder")}
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{t("pickupLocations.form.addressRequired")}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pickup-phone">{t("pickupLocations.form.phone")}</Label>
              <Input
                id="pickup-phone"
                {...register("phone")}
                placeholder={t("pickupLocations.form.phonePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup-hours">{t("pickupLocations.form.hours")}</Label>
              <Input
                id="pickup-hours"
                {...register("hours")}
                placeholder={t("pickupLocations.form.hoursPlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup-note">{t("pickupLocations.form.note")}</Label>
            <Textarea
              id="pickup-note"
              {...register("note")}
              placeholder={t("pickupLocations.form.notePlaceholder")}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickup-sort">{t("pickupLocations.form.sortOrder")}</Label>
              <Input
                id="pickup-sort"
                type="number"
                {...register("sort_order", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("pickupLocations.form.enabled")}</Label>
              <div className="pt-1">
                <Controller
                  control={control}
                  name="is_enabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("pickupLocations.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("pickupLocations.saving")}
                </>
              ) : isEdit ? (
                t("pickupLocations.save")
              ) : (
                t("pickupLocations.create")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

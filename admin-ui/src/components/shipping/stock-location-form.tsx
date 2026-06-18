"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  useCreateStockLocation,
  useUpdateStockLocation,
  useUpdateStockLocationSalesChannels,
  type StockLocationSetupWarning,
  type StockLocationWithZones,
} from "@/hooks/use-shipping"
import { useSalesChannels } from "@/hooks/use-settings"
import { adminFetch } from "@/lib/admin-api"
import { COUNTRY_GROUPS } from "@/lib/countries"
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

interface FormValues {
  name: string
  address_1: string
  city: string
  province: string
  postal_code: string
  country_code: string
}

interface StockLocationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editLocation?: StockLocationWithZones | null
}

const allCountries = COUNTRY_GROUPS.flatMap((g) => g.countries)

export function StockLocationForm({
  open,
  onOpenChange,
  editLocation,
}: StockLocationFormProps) {
  const t = useTranslations("shipping")
  const isEdit = !!editLocation
  const createMutation = useCreateStockLocation()
  const updateMutation = useUpdateStockLocation(editLocation?.id ?? "")
  const channelsMutation = useUpdateStockLocationSalesChannels(editLocation?.id ?? "")
  const queryClient = useQueryClient()
  const { data: salesChannelsData } = useSalesChannels()
  const allChannels = salesChannelsData?.sales_channels ?? []
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(new Set())
  const [submitError, setSubmitError] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      address_1: "",
      city: "",
      province: "",
      postal_code: "",
      country_code: "",
    },
  })

  useEffect(() => {
    if (open) {
      setSubmitError("")
      if (editLocation) {
        reset({
          name: editLocation.name,
          address_1: editLocation.address?.address_1 ?? "",
          city: editLocation.address?.city ?? "",
          province: editLocation.address?.province ?? "",
          postal_code: editLocation.address?.postal_code ?? "",
          country_code: editLocation.address?.country_code ?? "",
        })
        setSelectedChannelIds(
          new Set(editLocation.sales_channels?.map((sc) => sc.id) ?? [])
        )
      } else {
        reset({ name: "", address_1: "", city: "", province: "", postal_code: "", country_code: "" })
        setSelectedChannelIds(new Set())
      }
    }
  }, [open, editLocation, reset])

  const toggleChannel = (id: string) => {
    setSelectedChannelIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isPending =
    isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending ||
    channelsMutation.isPending

  const onSubmit = async (values: FormValues) => {
    setSubmitError("")
    const payload = {
      name: values.name,
      address: {
        address_1: values.address_1,
        city: values.city || undefined,
        province: values.province || undefined,
        postal_code: values.postal_code || undefined,
        country_code: values.country_code || undefined,
      },
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload)
        const prevIds = new Set(editLocation!.sales_channels?.map((sc) => sc.id) ?? [])
        const add = Array.from(selectedChannelIds).filter((id) => !prevIds.has(id))
        const remove = Array.from(prevIds).filter((id) => !selectedChannelIds.has(id))
        if (add.length || remove.length) {
          await channelsMutation.mutateAsync({
            add: add.length ? add : undefined,
            remove: remove.length ? remove : undefined,
          })
        }
      } else {
        const res = await createMutation.mutateAsync(payload)
        const newId = res.stock_location.id
        const setupWarnings: StockLocationSetupWarning[] = [...(res.setup_warnings ?? [])]
        if (selectedChannelIds.size > 0) {
          try {
            await adminFetch(`/admin/stock-locations/${newId}/sales-channels`, {
              method: "POST",
              body: { add: Array.from(selectedChannelIds) },
            })
          } catch {
            setupWarnings.push("sales_channels_failed")
          } finally {
            await Promise.allSettled([
              queryClient.invalidateQueries({ queryKey: ["stock-locations"] }),
              queryClient.invalidateQueries({ queryKey: ["stock-locations-zones"] }),
              queryClient.invalidateQueries({ queryKey: ["fulfillment-providers"] }),
            ])
          }
        }
        if (setupWarnings.length) {
          toast.warning(t("locations.form.createdWithSetupWarning"))
        }
      }
      if (!isEdit) {
        reset({ name: "", address_1: "", city: "", province: "", postal_code: "", country_code: "" })
        setSelectedChannelIds(new Set())
      }
      onOpenChange(false)
    } catch (err: any) {
      setSubmitError(err?.message || t("locations.form.saveFailed"))
    }
  }

  const countryCode = watch("country_code")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("locations.editLocation") : t("locations.addLocation")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("locations.form.name")}</Label>
            <Input
              {...register("name", { required: true })}
              placeholder={t("locations.form.namePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("locations.form.address")}</Label>
            <Input {...register("address_1", { required: true })} placeholder={t("locations.form.addressPlaceholder")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("locations.form.city")}</Label>
              <Input {...register("city")} />
            </div>
            <div className="space-y-2">
              <Label>{t("locations.form.province")}</Label>
              <Input {...register("province")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("locations.form.postalCode")}</Label>
              <Input {...register("postal_code")} />
            </div>
            <div className="space-y-2">
              <Label>{t("locations.form.country")}</Label>
              <Select
                value={countryCode}
                onChange={(e) => setValue("country_code", e.target.value)}
              >
                <option value="">{t("locations.form.selectCountry")}</option>
                {allCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.zh} ({c.code.toUpperCase()})
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {allChannels.length > 0 && (
            <div className="space-y-2">
              <Label>{t("locations.salesChannels")}</Label>
              <p className="text-xs text-muted-foreground">{t("locations.selectSalesChannels")}</p>
              <div className="rounded-md border p-3 space-y-2 max-h-40 overflow-y-auto">
                {allChannels.map((ch) => (
                  <label key={ch.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedChannelIds.has(ch.id)}
                      onChange={() => toggleChannel(ch.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{ch.name}</span>
                    {ch.is_disabled && (
                      <span className="text-xs text-muted-foreground">(disabled)</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("locations.form.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? t("locations.form.updating")
                  : t("locations.form.creating")
                : isEdit
                  ? t("locations.form.update")
                  : t("locations.form.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

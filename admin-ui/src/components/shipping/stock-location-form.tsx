"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import {
  useCreateStockLocation,
  useUpdateStockLocation,
  type StockLocationWithZones,
} from "@/hooks/use-shipping"
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
  const [submitError, setSubmitError] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
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
      } else {
        reset({ name: "", address_1: "", city: "", province: "", postal_code: "", country_code: "" })
      }
    }
  }, [open, editLocation, reset])

  const isPending = createMutation.isPending || updateMutation.isPending

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
      } else {
        await createMutation.mutateAsync(payload)
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

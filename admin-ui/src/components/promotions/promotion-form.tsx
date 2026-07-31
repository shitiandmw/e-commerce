"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, BadgeDollarSign, Loader2, Percent, Save } from "lucide-react"

import {
  Promotion,
  useCreateCampaign,
  useCreatePromotion,
  useUpdateCampaign,
  useUpdatePromotion,
} from "@/hooks/use-promotions"
import {
  buildCouponApplicationMethod,
  createCampaignIdentifier,
  minorToMajorAmount,
  percentageToDiscountRate,
} from "@/lib/promotion-config"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

const couponSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .regex(
      /^[A-Z0-9_-]+$/i,
      "Code must be alphanumeric (dashes/underscores allowed)"
    ),
  status: z.enum(["draft", "active", "inactive"]),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().positive("Value must be greater than zero"),
  currency_code: z.string().default("usd"),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
}).superRefine((data, ctx) => {
  if (
    data.discount_type === "percentage" &&
    (data.discount_value <= 0 || data.discount_value >= 10)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discount_value"],
      message: "Discount rate must be greater than 0 and less than 10",
    })
  }

  if (
    data.starts_at &&
    data.ends_at &&
    new Date(data.ends_at) <= new Date(data.starts_at)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ends_at"],
      message: "End date must be after the start date",
    })
  }
})

type CouponFormData = z.infer<typeof couponSchema>

interface PromotionFormProps {
  promotion?: Promotion
  mode: "create" | "edit"
}

function toDatetimeLocal(isoString?: string | null): string {
  if (!isoString) return ""
  const date = new Date(isoString)
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function PromotionForm({ promotion, mode }: PromotionFormProps) {
  const router = useRouter()
  const t = useTranslations("promotions")
  const createPromotion = useCreatePromotion()
  const updatePromotion = useUpdatePromotion(promotion?.id || "")
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign(promotion?.campaign?.id || "")
  const method = promotion?.application_method
  const currencyCode = method?.currency_code || "usd"

  const defaultValues: CouponFormData = promotion
    ? {
        code: promotion.code,
        status: promotion.status || "draft",
        discount_type: method?.type || "percentage",
        discount_value:
          method?.type === "fixed"
            ? minorToMajorAmount(method.value, currencyCode)
            : percentageToDiscountRate(method?.value || 10),
        currency_code: currencyCode,
        starts_at: toDatetimeLocal(promotion.campaign?.starts_at),
        ends_at: toDatetimeLocal(promotion.campaign?.ends_at),
      }
    : {
        code: "",
        status: "active",
        discount_type: "percentage",
        discount_value: 9,
        currency_code: "usd",
        starts_at: "",
        ends_at: "",
      }

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues,
  })

  const discountType = watch("discount_type")
  const watchedCode = watch("code")
  const watchedDiscountValue = Number(watch("discount_value")) || 0
  const watchedCurrency = watch("currency_code")
  const watchedStatus = watch("status")
  const watchedStartsAt = watch("starts_at")

  const discountSummary =
    discountType === "percentage"
      ? t("summary.rate", { value: watchedDiscountValue })
      : t("summary.fixed", {
          value: watchedDiscountValue,
          currency: watchedCurrency.toUpperCase(),
        })
  const timingSummary =
    watchedStatus === "draft"
      ? t("summary.draft")
      : watchedStatus === "inactive"
        ? t("summary.inactive")
        : watchedStartsAt
          ? t("summary.scheduled")
          : t("summary.immediate")

  const onSubmit = async (data: CouponFormData) => {
    try {
      const schedule = {
        starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
        ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
      }
      const hasSchedule = Boolean(data.starts_at || data.ends_at)
      const payload: Record<string, unknown> = {
        code: data.code.trim().toUpperCase(),
        status: data.status,
        is_automatic: false,
        application_method: buildCouponApplicationMethod(data),
      }

      if (mode === "create") {
        payload.type = "standard"
        if (hasSchedule) {
          payload.campaign = {
            name: `${data.code.trim().toUpperCase()} schedule`,
            campaign_identifier: createCampaignIdentifier(data.code),
            ...schedule,
          }
        }
        await createPromotion.mutateAsync(payload)
      } else {
        if (!promotion?.campaign && hasSchedule) {
          const { campaign } = await createCampaign.mutateAsync({
            name: `${data.code.trim().toUpperCase()} schedule`,
            campaign_identifier: createCampaignIdentifier(data.code),
            ...schedule,
          })
          payload.campaign_id = campaign.id
        }

        await updatePromotion.mutateAsync(payload)
        if (promotion?.campaign) {
          await updateCampaign.mutateAsync(schedule)
        }
      }

      router.push("/promotions")
    } catch {
      // Mutation errors are rendered below the form.
    }
  }

  const mutationError =
    createCampaign.error ||
    updateCampaign.error ||
    (mode === "create" ? createPromotion.error : updatePromotion.error)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/promotions">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {mode === "create" ? t("createPromotion") : t("editPromotion")}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {mode === "create"
                ? t("createSubtitle")
                : t("editing", { code: promotion?.code || "" })}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSubmitting
            ? t("saving")
            : mode === "create"
              ? t("createPromotion")
              : t("saveChanges")}
        </Button>
      </div>

      {mutationError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {mutationError instanceof Error
            ? mutationError.message
            : t("unknownError")}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-5 border-b pb-6">
            <h2 className="text-lg font-semibold">{t("form.basicInfo")}</h2>
            <div className="space-y-2">
              <Label htmlFor="code">{t("form.code")}</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder={t("form.codePlaceholder")}
                className="font-mono uppercase"
                autoComplete="off"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>
          </section>

          <section className="space-y-5 border-b pb-6">
            <h2 className="text-lg font-semibold">{t("form.discountConfig")}</h2>
            <Controller
              name="discount_type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("form.discountType")}>
                  <button
                    type="button"
                    aria-pressed={field.value === "percentage"}
                    onClick={() => {
                      field.onChange("percentage")
                      setValue("discount_value", 9, { shouldValidate: true })
                    }}
                    className={cn(
                      "flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors",
                      field.value === "percentage"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-accent"
                    )}
                  >
                    <Percent className="h-5 w-5" />
                    {t("form.rateDiscount")}
                  </button>
                  <button
                    type="button"
                    aria-pressed={field.value === "fixed"}
                    onClick={() => {
                      field.onChange("fixed")
                      setValue("discount_value", 20, { shouldValidate: true })
                    }}
                    className={cn(
                      "flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors",
                      field.value === "fixed"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-accent"
                    )}
                  >
                    <BadgeDollarSign className="h-5 w-5" />
                    {t("form.fixedDiscount")}
                  </button>
                </div>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  {discountType === "percentage"
                    ? t("form.discountRate")
                    : t("form.fixedValue")}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  min={discountType === "percentage" ? "0.1" : "0.01"}
                  max={discountType === "percentage" ? "9.9" : undefined}
                  step={discountType === "percentage" ? "0.1" : "0.01"}
                  {...register("discount_value")}
                />
                {errors.discount_value && (
                  <p className="text-sm text-destructive">
                    {errors.discount_value.message}
                  </p>
                )}
              </div>

              {discountType === "fixed" && (
                <div className="space-y-2">
                  <Label htmlFor="currency_code">{t("form.currency")}</Label>
                  <Controller
                    name="currency_code"
                    control={control}
                    render={({ field }) => (
                      <Select id="currency_code" value={field.value} onChange={field.onChange}>
                        <option value="usd">USD</option>
                        <option value="eur">EUR</option>
                        <option value="gbp">GBP</option>
                        <option value="cny">CNY</option>
                        <option value="jpy">JPY</option>
                      </Select>
                    )}
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="space-y-4 border-b pb-6">
            <h2 className="text-lg font-semibold">{t("schedule.title")}</h2>
            <div className="space-y-2">
              <Label htmlFor="status">{t("schedule.status")}</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select id="status" value={field.value} onChange={field.onChange}>
                    <option value="active">{t("status.active")}</option>
                    <option value="draft">{t("status.draft")}</option>
                    <option value="inactive">{t("status.inactive")}</option>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="starts_at">{t("schedule.startDate")}</Label>
              <Input id="starts_at" type="datetime-local" {...register("starts_at")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at">{t("schedule.endDate")}</Label>
              <Input id="ends_at" type="datetime-local" {...register("ends_at")} />
              {errors.ends_at && (
                <p className="text-sm text-destructive">{errors.ends_at.message}</p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t("summary.title")}</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("summary.sentence", {
                code: watchedCode.trim().toUpperCase() || t("summary.codePlaceholder"),
                discount: discountSummary,
                timing: timingSummary,
              })}
            </p>
          </section>
        </aside>
      </div>
    </form>
  )
}

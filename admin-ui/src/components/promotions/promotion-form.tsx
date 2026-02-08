"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Promotion,
  useCreatePromotion,
  useUpdatePromotion,
} from "@/hooks/use-promotions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

const promotionSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric (dashes/underscores allowed)"),
  type: z.enum(["standard", "buyget"]),
  is_automatic: z.boolean(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().min(0, "Value must be non-negative"),
  currency_code: z.string().default("usd"),
  target_type: z.enum(["items", "shipping_methods", "order"]),
  allocation: z.enum(["each", "across"]).optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

type PromotionFormData = z.infer<typeof promotionSchema>

interface PromotionFormProps {
  promotion?: Promotion
  mode: "create" | "edit"
}

function toDatetimeLocal(isoString?: string | null): string {
  if (!isoString) return ""
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PromotionForm({ promotion, mode }: PromotionFormProps) {
  const router = useRouter()
  const t = useTranslations("promotions")
  const createPromotion = useCreatePromotion()
  const updatePromotion = useUpdatePromotion(promotion?.id || "")

  const defaultValues: PromotionFormData = promotion
    ? {
        code: promotion.code,
        type: promotion.type,
        is_automatic: promotion.is_automatic,
        discount_type: promotion.application_method?.type || "percentage",
        discount_value: promotion.application_method?.value || 0,
        currency_code:
          promotion.application_method?.currency_code || "usd",
        target_type:
          promotion.application_method?.target_type || "order",
        allocation: promotion.application_method?.allocation || undefined,
        starts_at: toDatetimeLocal(promotion.starts_at),
        ends_at: toDatetimeLocal(promotion.ends_at),
      }
    : {
        code: "",
        type: "standard",
        is_automatic: false,
        discount_type: "percentage",
        discount_value: 0,
        currency_code: "usd",
        target_type: "order",
        allocation: undefined,
        starts_at: "",
        ends_at: "",
      }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues,
  })

  const discountType = watch("discount_type")

  const onSubmit = async (data: PromotionFormData) => {
    try {
      const payload: Record<string, unknown> = {
        code: data.code.toUpperCase(),
        type: data.type,
        is_automatic: data.is_automatic,
        application_method: {
          type: data.discount_type,
          value: data.discount_value,
          target_type: data.target_type,
          ...(data.discount_type === "fixed"
            ? { currency_code: data.currency_code }
            : {}),
          ...(data.allocation ? { allocation: data.allocation } : {}),
        },
        ...(data.starts_at
          ? { starts_at: new Date(data.starts_at).toISOString() }
          : {}),
        ...(data.ends_at
          ? { ends_at: new Date(data.ends_at).toISOString() }
          : {}),
      }

      if (mode === "create") {
        await createPromotion.mutateAsync(payload)
      } else {
        await updatePromotion.mutateAsync(payload)
      }

      router.push("/promotions")
    } catch {
      // Error is handled by mutation state
    }
  }

  const mutationError =
    mode === "create" ? createPromotion.error : updatePromotion.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/promotions">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? t("createPromotion") : t("editPromotion")}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? t("createSubtitle")
                : t("editing", { code: promotion?.code ?? "" })}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? t("createPromotion") : t("saveChanges")}
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {mutationError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {mutationError instanceof Error
            ? mutationError.message
            : t("errorOccurred")}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.basicInfo")}</h2>

            <div className="space-y-2">
              <Label htmlFor="code">{t("form.code")}</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder={t("form.codePlaceholder")}
                className="uppercase"
              />
              {errors.code && (
                <p className="text-sm text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">{t("form.promotionType")}</Label>
                <Select id="type" {...register("type")}>
                  <option value="standard">{t("type.standard")}</option>
                  <option value="buyget">{t("type.buyget")}</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_automatic">{t("form.applicationMode")}</Label>
                <Select
                  id="is_automatic"
                  {...register("is_automatic", {
                    setValueAs: (v) => v === "true",
                  })}
                >
                  <option value="false">{t("application.manual")}</option>
                  <option value="true">{t("application.automatic")}</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Discount Configuration */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.discountConfig")}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="discount_type">{t("form.discountType")}</Label>
                <Select id="discount_type" {...register("discount_type")}>
                  <option value="percentage">{t("form.percentage")}</option>
                  <option value="fixed">{t("form.fixedAmount")}</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  {t("form.discountValue")}{" "}
                  {discountType === "percentage" ? "(%)" : ""}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  step={discountType === "percentage" ? "1" : "0.01"}
                  {...register("discount_value")}
                  placeholder={discountType === "percentage" ? "10" : "5.00"}
                />
                {errors.discount_value && (
                  <p className="text-sm text-destructive">
                    {errors.discount_value.message}
                  </p>
                )}
              </div>
            </div>

            {discountType === "fixed" && (
              <div className="space-y-2">
                <Label htmlFor="currency_code">{t("form.currency")}</Label>
                <Select id="currency_code" {...register("currency_code")}>
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>
                  <option value="cny">CNY</option>
                  <option value="jpy">JPY</option>
                </Select>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target_type">{t("form.appliesTo")}</Label>
                <Select id="target_type" {...register("target_type")}>
                  <option value="order">{t("form.entireOrder")}</option>
                  <option value="items">{t("form.specificItems")}</option>
                  <option value="shipping_methods">{t("form.shippingMethods")}</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allocation">{t("form.allocation")}</Label>
                <Select id="allocation" {...register("allocation")}>
                  <option value="">{t("form.none")}</option>
                  <option value="each">{t("form.eachItem")}</option>
                  <option value="across">{t("form.acrossItems")}</option>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("schedule.title")}</h2>

            <div className="space-y-2">
              <Label htmlFor="starts_at">{t("schedule.startDate")}</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                {...register("starts_at")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ends_at">{t("schedule.endDate")}</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                {...register("ends_at")}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

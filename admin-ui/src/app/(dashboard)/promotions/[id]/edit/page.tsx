"use client"

import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePromotion } from "@/hooks/use-promotions"
import { PromotionForm } from "@/components/promotions/promotion-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { isEditableCoupon } from "@/lib/promotion-config"

export default function EditPromotionPage() {
  const t = useTranslations("promotions")
  const params = useParams()
  const promotionId = params.id as string
  const { data, isLoading, isError, error } = usePromotion(promotionId)

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data?.promotion) {
    return (
      <div className="space-y-6">
        <Link href="/promotions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToPromotions")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("promotionNotFound")}
          </p>
        </div>
      </div>
    )
  }

  if (!isEditableCoupon(data.promotion)) {
    return (
      <div className="space-y-6">
        <Link href={`/promotions/${promotionId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToPromotions")}
          </Button>
        </Link>
        <div className="max-w-2xl rounded-md border p-6">
          <h1 className="text-xl font-semibold">{t("legacy.readOnlyTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("legacy.readOnlyDescription")}
          </p>
        </div>
      </div>
    )
  }

  return <PromotionForm promotion={data.promotion} mode="edit" />
}

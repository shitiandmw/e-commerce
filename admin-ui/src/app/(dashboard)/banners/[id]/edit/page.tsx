"use client"

import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useBannerSlot } from "@/hooks/use-banners"
import { BannerSlotForm } from "@/components/banners/banner-slot-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditBannerSlotPage() {
  const t = useTranslations("banners")
  const params = useParams()
  const slotId = params.id as string
  const { data, isLoading, isError, error } = useBannerSlot(slotId)

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
        <div className="max-w-2xl">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (isError || !data?.banner_slot) {
    return (
      <div className="space-y-6">
        <Link href="/banners">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToSlots")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("slotNotFound")}
          </p>
        </div>
      </div>
    )
  }

  return <BannerSlotForm slot={data.banner_slot} mode="edit" />
}

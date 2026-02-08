"use client"

import { useParams } from "next/navigation"
import { usePromotion } from "@/hooks/use-promotions"
import { PromotionForm } from "@/components/promotions/promotion-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditPromotionPage() {
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
            Back to Promotions
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : "Promotion not found or failed to load."}
          </p>
        </div>
      </div>
    )
  }

  return <PromotionForm promotion={data.promotion} mode="edit" />
}

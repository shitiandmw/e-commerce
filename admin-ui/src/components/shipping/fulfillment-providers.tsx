"use client"

import { useTranslations } from "next-intl"
import { useFulfillmentProviders } from "@/hooks/use-shipping"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Truck } from "lucide-react"

export function FulfillmentProviders() {
  const t = useTranslations("shipping")
  const { data, isLoading } = useFulfillmentProviders()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const providers = data?.fulfillment_providers || []

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("providers.title")}</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("providers.description")}
      </p>

      {providers.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("providers.noProviders")}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between rounded-md border p-4"
            >
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{provider.id}</span>
              </div>
              <Badge variant={provider.is_enabled !== false ? "default" : "secondary"}>
                {provider.is_enabled !== false ? t("providers.enabled") : t("providers.disabled")}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

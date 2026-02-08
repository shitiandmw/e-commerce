"use client"

import { useTranslations } from "next-intl"
import { useShippingOptions } from "@/hooks/use-settings"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Truck } from "lucide-react"

export function ShippingSettings() {
  const t = useTranslations("settings")
  const { data, isLoading } = useShippingOptions()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const options = data?.shipping_options || []

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("shipping.title")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("shipping.description")}
        </p>

        {options.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("shipping.noOptions")}
          </div>
        ) : (
          <div className="space-y-3">
            {options.map((opt) => (
              <div
                key={opt.id}
                className="flex items-start justify-between rounded-md border p-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{opt.name}</span>
                    <Badge variant="outline">{opt.price_type}</Badge>
                    {opt.provider_id && (
                      <Badge variant="secondary">{opt.provider_id}</Badge>
                    )}
                  </div>
                  {opt.prices && opt.prices.length > 0 && (
                    <div className="flex gap-2">
                      {opt.prices.map((p, i) => (
                        <span
                          key={i}
                          className="text-sm text-muted-foreground"
                        >
                          {p.currency_code.toUpperCase()}{" "}
                          {(p.amount / 100).toFixed(2)}
                        </span>
                      ))}
                    </div>
                  )}
                  {opt.type && (
                    <p className="text-xs text-muted-foreground">
                      {t("shipping.type")} {opt.type.label} ({opt.type.code})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

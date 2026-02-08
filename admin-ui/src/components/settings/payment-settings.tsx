"use client"

import { useTranslations } from "next-intl"
import { usePaymentProviders } from "@/hooks/use-settings"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CreditCard } from "lucide-react"

export function PaymentSettings() {
  const t = useTranslations("settings")
  const { data, isLoading } = usePaymentProviders()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const providers = data?.payment_providers || []

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("payment.title")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("payment.description")}
        </p>

        {providers.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("payment.noProviders")}
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between rounded-md border p-4"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{provider.id}</span>
                    <p className="text-xs text-muted-foreground">
                      {t("payment.paymentProvider")}
                    </p>
                  </div>
                </div>
                <Badge variant={provider.is_enabled !== false ? "success" : "secondary"}>
                  {provider.is_enabled !== false ? t("payment.enabled") : t("payment.disabled")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

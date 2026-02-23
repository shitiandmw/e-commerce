"use client"

import { useTranslations, useLocale } from "next-intl"
import { useFulfillmentProviders } from "@/hooks/use-shipping"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Truck } from "lucide-react"

const PROVIDER_LABELS: Record<string, { zh: string; en: string }> = {
  "manual_manual": { zh: "手动发货", en: "Manual Fulfillment" },
  "pp_manual_manual": { zh: "手动发货", en: "Manual Fulfillment" },
  "pp_system_default": { zh: "系统默认", en: "System Default" },
}

export function getProviderLabel(id: string, isZh: boolean): string {
  const label = PROVIDER_LABELS[id]
  if (label) return isZh ? label.zh : label.en
  // 把 pp_xxx_yyy 格式化为可读名称
  const name = id.replace(/^pp_/, "").replace(/_/g, " ")
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function FulfillmentProviders() {
  const t = useTranslations("shipping")
  const locale = useLocale()
  const isZh = locale.startsWith("zh")
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
                <div>
                  <span className="font-medium text-sm">{getProviderLabel(provider.id, isZh)}</span>
                  <p className="text-xs text-muted-foreground font-mono">{provider.id}</p>
                </div>
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

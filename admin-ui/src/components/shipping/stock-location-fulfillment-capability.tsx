"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  DEFAULT_FULFILLMENT_PROVIDER_ID,
  useEnableManualFulfillmentProvider,
  useFulfillmentProviders,
} from "@/hooks/use-shipping"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getProviderLabel } from "@/components/shipping/fulfillment-providers"
import { AlertTriangle, CheckCircle2, Truck } from "lucide-react"

interface StockLocationFulfillmentCapabilityProps {
  locationId: string
  compact?: boolean
}

export function StockLocationFulfillmentCapability({
  locationId,
  compact = false,
}: StockLocationFulfillmentCapabilityProps) {
  const t = useTranslations("shipping")
  const locale = useLocale()
  const isZh = locale.startsWith("zh")
  const { data, isLoading, isError } = useFulfillmentProviders(
    { stock_location_id: locationId },
    { enabled: !!locationId }
  )
  const enableManual = useEnableManualFulfillmentProvider(locationId)

  const providers = data?.fulfillment_providers ?? []
  const manualProvider = providers.find(
    (provider) => provider.id === DEFAULT_FULFILLMENT_PROVIDER_ID
  )
  const isManualEnabled = manualProvider?.is_enabled !== false && !!manualProvider
  const enabledProviders = providers.filter(
    (provider) => provider.is_enabled !== false
  )
  const hasFulfillmentCapability = enabledProviders.length > 0
  const canEnableManual =
    !!locationId && !isManualEnabled && !isLoading && !isError

  if (compact) {
    if (isLoading) {
      return <Skeleton className="h-5 w-24" />
    }

    if (isError) {
      return (
        <Badge variant="destructive" className="text-xs gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t("locations.fulfillment.statusUnknown")}
        </Badge>
      )
    }

    if (isManualEnabled) {
      return (
        <Badge variant="success" className="text-xs gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {t("locations.fulfillment.manualEnabled")}
        </Badge>
      )
    }

    return hasFulfillmentCapability ? (
      <Badge variant="success" className="text-xs gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {t("locations.fulfillment.configured")}
      </Badge>
    ) : (
      <Badge variant="warning" className="text-xs gap-1">
        <AlertTriangle className="h-3 w-3" />
        {t("locations.fulfillment.notConfigured")}
      </Badge>
    )
  }

  const handleEnableManual = () => {
    enableManual.mutate()
  }

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <LabelText>{t("locations.fulfillment.title")}</LabelText>
        </div>
        {isError ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t("locations.fulfillment.statusUnknown")}
          </Badge>
        ) : hasFulfillmentCapability ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t("locations.fulfillment.enabled")}
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t("locations.fulfillment.notConfigured")}
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {t("locations.fulfillment.description")}
      </p>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-36" />
        </div>
      ) : isError ? (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {t("locations.fulfillment.loadFailed")}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {enabledProviders.length > 0 ? (
              enabledProviders.map((provider) => (
                <Badge key={provider.id} variant="secondary">
                  {getProviderLabel(provider.id, isZh)}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                {t("locations.fulfillment.noEnabledMethods")}
              </span>
            )}
          </div>

          {!isManualEnabled && (
            <Button
              type="button"
              size="sm"
              onClick={handleEnableManual}
              disabled={!canEnableManual || enableManual.isPending}
            >
              {enableManual.isPending
                ? t("locations.fulfillment.enablingManual")
                : t("locations.fulfillment.enableManual")}
            </Button>
          )}

          {enableManual.isError && (
            <p className="text-sm text-destructive">
              {enableManual.error instanceof Error
                ? enableManual.error.message
                : t("locations.fulfillment.enableFailed")}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function LabelText({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium">{children}</span>
}

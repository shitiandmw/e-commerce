"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  usePaymentSettings,
  useUpdatePaymentSettings,
  formatProviderName,
} from "@/hooks/use-settings"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CreditCard, Key, Globe, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

const STRIPE_PROVIDER_ID = "pp_stripe_stripe"
const WOOSHPAY_PROVIDER_ID = "pp_wooshpay_wooshpay"

export function PaymentSettings() {
  const t = useTranslations("settings")
  const { data, isLoading } = usePaymentSettings()
  const updateMutation = useUpdatePaymentSettings()
  const providers = data?.payment_settings || []
  const [dirtyFields, setDirtyFields] = useState<Record<string, Record<string, string | boolean>>>({})

  const getDirtyValue = (providerId: string, field: string, fallback: string | boolean) => {
    const providerDirty = dirtyFields[providerId]
    if (providerDirty && field in providerDirty) return providerDirty[field]
    return fallback
  }

  const setDirtyValue = (providerId: string, field: string, value: string | boolean) => {
    setDirtyFields((prev) => ({
      ...prev,
      [providerId]: { ...(prev[providerId] || {}), [field]: value },
    }))
  }

  const handleSave = async (providerId: string) => {
    const provider = providers.find((p) => p.provider_id === providerId)
    if (!provider) return
    const dirty = dirtyFields[providerId] || {}

    const body: Record<string, unknown> = { provider_id: providerId }
    if ("is_enabled" in dirty) body.is_enabled = dirty.is_enabled
    if ("display_name" in dirty) body.display_name = dirty.display_name
    if ("description" in dirty) body.description = dirty.description
    if ("sandbox_mode" in dirty) body.sandbox_mode = dirty.sandbox_mode
    if ("api_key" in dirty) body.api_key = dirty.api_key
    if ("webhook_secret" in dirty) body.webhook_secret = dirty.webhook_secret

    try {
      await updateMutation.mutateAsync(body as any)
      setDirtyFields((prev) => {
        const next = { ...prev }
        delete next[providerId]
        return next
      })
      toast.success(t("paymentConfig.savedSuccess"))
    } catch {
      toast.error(t("paymentConfig.saveFailed"))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("paymentConfig.title")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t("paymentConfig.description")}</p>

        {providers.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("payment.noProviders")}
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => {
              const name = provider.display_name || formatProviderName(provider.provider_id)
              const enabled = getDirtyValue(provider.provider_id, "is_enabled", provider.is_enabled) as boolean
              const isStripe = provider.provider_id === STRIPE_PROVIDER_ID
              const isWooShPay = provider.provider_id === WOOSHPAY_PROVIDER_ID
              const hasDirty = !!dirtyFields[provider.provider_id]

              return (
                <div key={provider.provider_id} className="rounded-md border p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{name}</span>
                        <p className="text-xs text-muted-foreground">{provider.provider_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={enabled ? "success" : "secondary"}>
                        {enabled ? t("payment.enabled") : t("payment.disabled")}
                      </Badge>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(v) => setDirtyValue(provider.provider_id, "is_enabled", v)}
                      />
                    </div>
                  </div>

                  {/* Common fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("paymentConfig.displayName")}</Label>
                      <Input
                        value={(getDirtyValue(provider.provider_id, "display_name", provider.display_name || "") as string)}
                        onChange={(e) => setDirtyValue(provider.provider_id, "display_name", e.target.value)}
                        placeholder={t("paymentConfig.displayNamePlaceholder")}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("paymentConfig.descriptionLabel")}</Label>
                      <Input
                        value={(getDirtyValue(provider.provider_id, "description", provider.description || "") as string)}
                        onChange={(e) => setDirtyValue(provider.provider_id, "description", e.target.value)}
                        placeholder={t("paymentConfig.descriptionPlaceholder")}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Stripe: env note */}
                  {isStripe && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/30 rounded p-3">
                      <Key className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{t("paymentConfig.stripeEnvNote")}</span>
                    </div>
                  )}

                  {/* WooShPay: sandbox + keys */}
                  {isWooShPay && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-xs">{t("paymentConfig.sandboxMode")}</Label>
                        </div>
                        <Switch
                          checked={(getDirtyValue(provider.provider_id, "sandbox_mode", provider.sandbox_mode) as boolean)}
                          onCheckedChange={(v) => setDirtyValue(provider.provider_id, "sandbox_mode", v)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            {t("paymentConfig.apiKey")}
                            {provider.is_api_key_set && (
                              <Badge variant="secondary" className="ml-2 text-[10px]">{t("paymentConfig.configured")}</Badge>
                            )}
                          </Label>
                          <Input
                            type="password"
                            value={(getDirtyValue(provider.provider_id, "api_key", provider.api_key_masked || "") as string)}
                            onChange={(e) => setDirtyValue(provider.provider_id, "api_key", e.target.value)}
                            placeholder={provider.is_api_key_set ? "****" : t("paymentConfig.apiKeyPlaceholder")}
                            className="h-9 text-sm font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            {t("paymentConfig.webhookSecret")}
                            {provider.is_webhook_secret_set && (
                              <Badge variant="secondary" className="ml-2 text-[10px]">{t("paymentConfig.configured")}</Badge>
                            )}
                          </Label>
                          <Input
                            type="password"
                            value={(getDirtyValue(provider.provider_id, "webhook_secret", provider.webhook_secret_masked || "") as string)}
                            onChange={(e) => setDirtyValue(provider.provider_id, "webhook_secret", e.target.value)}
                            placeholder={provider.is_webhook_secret_set ? "****" : t("paymentConfig.webhookSecretPlaceholder")}
                            className="h-9 text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save button */}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleSave(provider.provider_id)}
                      disabled={!hasDirty || updateMutation.isPending}
                      className="gap-1.5"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {t("paymentConfig.save")}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import {
  useCreateShippingOption,
  useUpdateShippingOption,
  useShippingProfiles,
  useFulfillmentProviders,
  useStockLocations,
  type ShippingOption,
} from "@/hooks/use-shipping"
import { useRegions } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { getProviderLabel } from "@/components/shipping/fulfillment-providers"

interface ShippingOptionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editOption?: ShippingOption | null
}

export function ShippingOptionForm({
  open,
  onOpenChange,
  editOption,
}: ShippingOptionFormProps) {
  const t = useTranslations("shipping")
  const locale = useLocale()
  const isZh = locale.startsWith("zh")
  const createOption = useCreateShippingOption()
  const updateOption = useUpdateShippingOption(editOption?.id || "")
  const { data: profilesData } = useShippingProfiles()
  const { data: providersData } = useFulfillmentProviders()
  const { data: regionsData } = useRegions()

  const [name, setName] = useState("")
  const [shippingProfileId, setShippingProfileId] = useState("")
  const [providerId, setProviderId] = useState("")
  const [amount, setAmount] = useState("")
  const [currencyCode, setCurrencyCode] = useState("usd")
  const [metadataType, setMetadataType] = useState<"pickup" | "delivery" | "">("delivery")

  const profiles = profilesData?.shipping_profiles || []
  const providers = providersData?.fulfillment_providers || []
  const regions = regionsData?.regions || []

  useEffect(() => {
    if (editOption) {
      setName(editOption.name)
      setShippingProfileId(editOption.shipping_profile_id || "")
      setProviderId(editOption.provider_id || "")
      setMetadataType((editOption.metadata?.type as "pickup" | "delivery") || "delivery")
      const price = editOption.prices?.[0]
      if (price) {
        setAmount(String(price.amount / 100))
        setCurrencyCode(price.currency_code || "usd")
      }
    } else {
      setName("")
      setShippingProfileId(profiles[0]?.id || "")
      setProviderId(providers[0]?.id || "")
      setMetadataType("delivery")
      setAmount("")
      setCurrencyCode(regions[0]?.currency_code || "usd")
    }
  }, [editOption, open, profiles, providers, regions])

  const handleSubmit = () => {
    if (!name.trim()) return

    const isPickup = metadataType === "pickup"

    const payload: Record<string, unknown> = {
      name: name.trim(),
      price_type: "flat",
      metadata: { type: metadataType || "delivery" },
    }

    if (shippingProfileId) {
      payload.shipping_profile_id = shippingProfileId
    }
    if (providerId) {
      payload.provider_id = providerId
    }

    if (isPickup) {
      payload.prices = [{ amount: 0, currency_code: currencyCode }]
    } else if (amount) {
      payload.prices = [
        {
          amount: Math.round(parseFloat(amount) * 100),
          currency_code: currencyCode,
        },
      ]
    }

    if (editOption) {
      updateOption.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      })
    } else {
      createOption.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      })
    }
  }

  const isPending = createOption.isPending || updateOption.isPending

  const currencyCodes =
    regions.length > 0
      ? Array.from(new Set(regions.map((r) => r.currency_code)))
      : ["usd", "eur", "gbp"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editOption ? t("options.editOption") : t("options.createOption")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="option-name">{t("options.form.name")}</Label>
            <Input
              id="option-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("options.form.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata-type">{t("options.form.type")}</Label>
            <Select
              id="metadata-type"
              value={metadataType}
              onChange={(e) => setMetadataType(e.target.value as "pickup" | "delivery")}
            >
              <option value="delivery">{t("options.form.typeDelivery")}</option>
              <option value="pickup">{t("options.form.typePickup")}</option>
            </Select>
          </div>

          {metadataType !== "pickup" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t("options.form.amount")}</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">{t("options.form.currencyCode")}</Label>
                <Select
                  id="currency"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                >
                  {currencyCodes.map((code) => (
                    <option key={code} value={code}>
                      {code.toUpperCase()}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {providers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="provider">{t("options.form.provider")}</Label>
              <Select
                id="provider"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
              >
                <option value="">{t("options.form.selectProvider")}</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getProviderLabel(p.id, isZh)}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("options.form.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
              {isPending
                ? editOption
                  ? t("options.form.updating")
                  : t("options.form.creating")
                : editOption
                  ? t("options.form.update")
                  : t("options.form.create")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

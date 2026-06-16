"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"
import {
  useCreateShippingOption,
  useUpdateShippingOption,
  useShippingProfiles,
  useShippingOptionTypes,
  useFulfillmentProviders,
  useStockLocationsWithZones,
  type ShippingOption,
} from "@/hooks/use-shipping"
import { toSlug } from "@/lib/slug"
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
  const { data: optionTypesData, isLoading: isLoadingOptionTypes } = useShippingOptionTypes()
  const { data: providersData } = useFulfillmentProviders()
  const { data: regionsData } = useRegions()
  const { data: locationsData } = useStockLocationsWithZones()

  const [name, setName] = useState("")
  const [serviceZoneId, setServiceZoneId] = useState("")
  const [shippingOptionTypeId, setShippingOptionTypeId] = useState("")
  const [shippingProfileId, setShippingProfileId] = useState("")
  const [providerId, setProviderId] = useState("")
  const [amount, setAmount] = useState("")
  const [currencyCode, setCurrencyCode] = useState("usd")
  const [metadataType, setMetadataType] = useState<"pickup" | "delivery" | "">("delivery")

  const didDefaultServiceZone = useRef(false)
  const didDefaultShippingOptionType = useRef(false)
  const didDefaultShippingProfile = useRef(false)
  const didDefaultProvider = useRef(false)
  const didDefaultCurrency = useRef(false)
  const initializedFormKey = useRef("")

  const profiles = profilesData?.shipping_profiles || []
  const optionTypes = optionTypesData?.shipping_option_types || []
  const providers = providersData?.fulfillment_providers || []
  const regions = regionsData?.regions || []
  const serviceZoneOptions = useMemo(
    () =>
      (locationsData?.stock_locations || []).flatMap((location) =>
        (location.fulfillment_sets || []).flatMap((fulfillmentSet) =>
          (fulfillmentSet.service_zones || []).map((zone) => ({
            id: zone.id,
            name: zone.name,
            fulfillmentSetName: fulfillmentSet.name,
            locationName: location.name,
          }))
        )
      ),
    [locationsData]
  )
  const mutationError = editOption ? updateOption.error : createOption.error
  const currentServiceZoneId = editOption?.service_zone_id || ""
  const shouldShowMissingCurrentZone =
    !!currentServiceZoneId &&
    !serviceZoneOptions.some((zone) => zone.id === currentServiceZoneId)
  const isEditing = !!editOption
  const firstServiceZoneId = serviceZoneOptions[0]?.id || ""
  const firstShippingOptionTypeId = optionTypes[0]?.id || ""
  const firstShippingProfileId = profiles[0]?.id || ""
  const firstProviderId = providers[0]?.id || ""
  const firstCurrencyCode = regions[0]?.currency_code || ""
  const currencyCodes =
    regions.length > 0
      ? Array.from(new Set(regions.map((r) => r.currency_code)))
      : ["usd", "eur", "gbp"]
  const selectedCurrencyCode = currencyCode || currencyCodes[0] || "usd"

  useEffect(() => {
    if (!open) {
      initializedFormKey.current = ""
      return
    }

    const nextFormKey = editOption ? `edit:${editOption.id}` : "create"
    if (initializedFormKey.current === nextFormKey) return
    initializedFormKey.current = nextFormKey

    didDefaultServiceZone.current = false
    didDefaultShippingOptionType.current = false
    didDefaultShippingProfile.current = false
    didDefaultProvider.current = false
    didDefaultCurrency.current = false

    if (editOption) {
      setName(editOption.name)
      setServiceZoneId(editOption.service_zone_id || "")
      setShippingOptionTypeId(editOption.type?.id || "")
      setShippingProfileId(editOption.shipping_profile_id || "")
      setProviderId(editOption.provider_id || "")
      setMetadataType((editOption.metadata?.type as "pickup" | "delivery") || "delivery")
      const price = editOption.prices?.[0]
      if (price) {
        setAmount(String(price.amount / 100))
        setCurrencyCode(price.currency_code || "usd")
      } else {
        setAmount("")
        setCurrencyCode("usd")
      }
    } else {
      setName("")
      setServiceZoneId("")
      setShippingOptionTypeId("")
      setShippingProfileId("")
      setProviderId("")
      setMetadataType("delivery")
      setAmount("")
      setCurrencyCode("")
    }
  }, [editOption, open])

  useEffect(() => {
    if (
      !open ||
      isEditing ||
      didDefaultServiceZone.current ||
      serviceZoneId ||
      !firstServiceZoneId
    ) {
      return
    }
    didDefaultServiceZone.current = true
    setServiceZoneId(firstServiceZoneId)
  }, [firstServiceZoneId, isEditing, open, serviceZoneId])

  useEffect(() => {
    if (
      !open ||
      isEditing ||
      didDefaultShippingOptionType.current ||
      shippingOptionTypeId ||
      !firstShippingOptionTypeId
    ) {
      return
    }
    didDefaultShippingOptionType.current = true
    setShippingOptionTypeId(firstShippingOptionTypeId)
  }, [firstShippingOptionTypeId, isEditing, open, shippingOptionTypeId])

  useEffect(() => {
    if (
      !open ||
      isEditing ||
      didDefaultShippingProfile.current ||
      shippingProfileId ||
      !firstShippingProfileId
    ) {
      return
    }
    didDefaultShippingProfile.current = true
    setShippingProfileId(firstShippingProfileId)
  }, [firstShippingProfileId, isEditing, open, shippingProfileId])

  useEffect(() => {
    if (
      !open ||
      isEditing ||
      didDefaultProvider.current ||
      providerId ||
      !firstProviderId
    ) {
      return
    }
    didDefaultProvider.current = true
    setProviderId(firstProviderId)
  }, [firstProviderId, isEditing, open, providerId])

  useEffect(() => {
    if (
      !open ||
      isEditing ||
      didDefaultCurrency.current ||
      currencyCode ||
      !firstCurrencyCode
    ) {
      return
    }
    didDefaultCurrency.current = true
    setCurrencyCode(firstCurrencyCode)
  }, [currencyCode, firstCurrencyCode, isEditing, open])

  const handleSubmit = () => {
    if (!name.trim() || (!editOption && !serviceZoneId)) return

    const isPickup = metadataType === "pickup"

    const payload: Record<string, unknown> = {
      name: name.trim(),
      price_type: "flat",
      metadata: { type: metadataType || "delivery" },
    }

    if (!editOption) {
      payload.service_zone_id = serviceZoneId
      if (shippingOptionTypeId) {
        payload.type_id = shippingOptionTypeId
      } else {
        const typeLabel = name.trim()
        payload.type = {
          label: typeLabel,
          description: typeLabel,
          code: toSlug(typeLabel) || "shipping-option",
        }
      }
    }
    if (shippingProfileId) {
      payload.shipping_profile_id = shippingProfileId
    }
    if (providerId) {
      payload.provider_id = providerId
    }

    if (isPickup) {
      payload.prices = [{ amount: 0, currency_code: selectedCurrencyCode }]
    } else if (amount) {
      payload.prices = [
        {
          amount: Math.round(parseFloat(amount) * 100),
          currency_code: selectedCurrencyCode,
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
  const isSubmitDisabled =
    !name.trim() ||
    (!editOption && (!serviceZoneId || isLoadingOptionTypes)) ||
    isPending

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
            <Label htmlFor="service-zone">{t("options.form.serviceZone")}</Label>
            <Select
              id="service-zone"
              value={serviceZoneId}
              onChange={(e) => setServiceZoneId(e.target.value)}
              disabled={!!editOption || (serviceZoneOptions.length === 0 && !serviceZoneId)}
            >
              <option value="">{t("options.form.selectServiceZone")}</option>
              {shouldShowMissingCurrentZone && (
                <option value={currentServiceZoneId}>
                  {t("options.form.currentServiceZone", {
                    id: currentServiceZoneId.slice(0, 8),
                  })}
                </option>
              )}
              {serviceZoneOptions.map((zone) => {
                const label = `${zone.name} - ${zone.locationName} / ${zone.fulfillmentSetName}`
                return (
                  <option key={zone.id} value={zone.id}>
                    {label}
                  </option>
                )
              })}
            </Select>
            {serviceZoneOptions.length === 0 && !serviceZoneId && (
              <p className="text-xs text-muted-foreground">
                {t("options.form.noServiceZones")}
              </p>
            )}
            {editOption && (
              <p className="text-xs text-muted-foreground">
                {t("options.form.serviceZoneReadonlyHint")}
              </p>
            )}
          </div>

          {!editOption && optionTypes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="shipping-option-type">{t("options.form.shippingOptionType")}</Label>
              <Select
                id="shipping-option-type"
                value={shippingOptionTypeId}
                onChange={(e) => setShippingOptionTypeId(e.target.value)}
              >
                {optionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

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
                  value={selectedCurrencyCode}
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

          {mutationError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {mutationError instanceof Error
                ? mutationError.message
                : t("options.form.saveFailed")}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("options.form.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
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

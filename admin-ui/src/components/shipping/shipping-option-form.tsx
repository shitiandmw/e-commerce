"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useTranslations, useLocale } from "next-intl"
import {
  useCreateShippingOption,
  useUpdateShippingOptionConfiguration,
  useShippingProfiles,
  useShippingOptionTypes,
  useFulfillmentProviders,
  useStockLocationsWithZones,
  useShippingOptionPickupLocation,
  useSyncShippingOptionPickupLocation,
  type ShippingOption,
} from "@/hooks/use-shipping"
import { usePickupLocations } from "@/hooks/use-pickup-locations"
import { adminFetch } from "@/lib/admin-api"
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
import {
  getPickupLocationUnavailabilityReason,
  type PickupLocationUnavailabilityReason,
} from "@/lib/shipping-form-state"
import { usePickupLocationSelectionGuard } from "@/hooks/use-shipping-form-state"

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
  const updateConfiguration = useUpdateShippingOptionConfiguration(
    editOption?.id || ""
  )
  const { data: profilesData } = useShippingProfiles()
  const { data: optionTypesData, isLoading: isLoadingOptionTypes } = useShippingOptionTypes()
  const { data: regionsData } = useRegions()
  const {
    data: locationsData,
    isLoading: isLoadingServiceZones,
    isError: isServiceZonesError,
  } = useStockLocationsWithZones()
  const {
    data: pickupLocationsData,
    isLoading: isLoadingPickupLocations,
    isError: isPickupLocationsError,
    isFetching: isFetchingPickupLocations,
    refetch: refetchPickupLocations,
  } = usePickupLocations({ limit: 100 })
  const { data: pickupBindingData, isLoading: isLoadingPickupBinding } =
    useShippingOptionPickupLocation(open ? editOption?.id : undefined)
  const syncPickupLocation = useSyncShippingOptionPickupLocation()

  const [name, setName] = useState("")
  const [serviceZoneId, setServiceZoneId] = useState("")
  const [shippingOptionTypeId, setShippingOptionTypeId] = useState("")
  const [shippingProfileId, setShippingProfileId] = useState("")
  const [providerId, setProviderId] = useState("")
  const [amount, setAmount] = useState("")
  const [currencyCode, setCurrencyCode] = useState("usd")
  const [metadataType, setMetadataType] = useState<"pickup" | "delivery" | "">("delivery")
  const [pickupLocationId, setPickupLocationId] = useState("")
  const [pickupSelectionWarningReason, setPickupSelectionWarningReason] =
    useState<PickupLocationUnavailabilityReason | null>(null)
  const [submitError, setSubmitError] = useState<Error | null>(null)

  const didDefaultServiceZone = useRef(false)
  const didDefaultShippingOptionType = useRef(false)
  const didDefaultShippingProfile = useRef(false)
  const didDefaultProvider = useRef(false)
  const didDefaultCurrency = useRef(false)
  const initializedFormKey = useRef("")

  const profiles = profilesData?.shipping_profiles || []
  const optionTypes = optionTypesData?.shipping_option_types || []
  const regions = regionsData?.regions || []
  const serviceZoneOptions = useMemo(
    () =>
      (locationsData?.stock_locations || []).flatMap((location) =>
        (location.fulfillment_sets || []).flatMap((fulfillmentSet) =>
          (fulfillmentSet.service_zones || []).map((zone) => ({
            id: zone.id,
            name: zone.name,
            geoZones: zone.geo_zones || [],
            fulfillmentSetName: fulfillmentSet.name,
            locationName: location.name,
            stockLocationId: location.id,
          }))
        )
      ),
    [locationsData]
  )
  const selectedServiceZone = serviceZoneOptions.find(
    (zone) => zone.id === serviceZoneId
  )
  const selectedStockLocationId = selectedServiceZone?.stockLocationId
  const { data: providersData, isFetching: isFetchingProviders } =
    useFulfillmentProviders(
      selectedStockLocationId ? { stock_location_id: selectedStockLocationId } : {},
      { enabled: !!selectedStockLocationId }
    )
  const providers = selectedStockLocationId
    ? (providersData?.fulfillment_providers || []).filter(
        (provider) => provider.is_enabled !== false
      )
    : []
  const mutationError =
    submitError ||
    (editOption ? updateConfiguration.error : createOption.error) ||
    (!editOption ? syncPickupLocation.error : null)
  const pickupLocationOptions = useMemo(
    () =>
      (pickupLocationsData?.pickup_locations || []).map((location) => ({
        location,
        reason: getPickupLocationUnavailabilityReason(
          location,
          editOption?.id
        ),
      })),
    [editOption?.id, pickupLocationsData?.pickup_locations]
  )
  const selectablePickupLocationCount = pickupLocationOptions.filter(
    (option) => !option.reason
  ).length
  const pickupSelectionValidationReady =
    !isLoadingPickupLocations &&
    !isPickupLocationsError
  const handlePickupLocationInvalidated = useCallback(
    (reason: PickupLocationUnavailabilityReason) => {
      setPickupLocationId("")
      setPickupSelectionWarningReason(reason)
    },
    []
  )
  const selectedPickupLocationReason = usePickupLocationSelectionGuard({
    pickupLocationId,
    options: pickupLocationOptions,
    validationReady: pickupSelectionValidationReady,
    onInvalidate: handlePickupLocationInvalidated,
  })
  const currentServiceZoneId = editOption?.service_zone_id || ""
  const shouldShowMissingCurrentZone =
    !!currentServiceZoneId &&
    !serviceZoneOptions.some((zone) => zone.id === currentServiceZoneId)
  const isEditing = !!editOption
  const firstServiceZoneId = serviceZoneOptions[0]?.id || ""
  const firstShippingOptionTypeId = optionTypes[0]?.id || ""
  const firstShippingProfileId = profiles[0]?.id || ""
  const firstProviderId = providers.length === 1 ? providers[0]?.id || "" : ""
  const hasSelectedServiceZoneWithoutStockLocation =
    !!serviceZoneId && !selectedStockLocationId
  const hasNoAvailableProviders =
    !!selectedStockLocationId && !isFetchingProviders && providers.length === 0
  const shouldShowProviderSelect = providers.length > 1
  const shouldShowProviderHint =
    hasNoAvailableProviders || (!editOption && hasSelectedServiceZoneWithoutStockLocation)
  const firstCurrencyCode = regions[0]?.currency_code || ""
  const currencyCodes =
    regions.length > 0
      ? Array.from(new Set(regions.map((r) => r.currency_code)))
      : ["usd", "eur", "gbp"]
  const selectedCurrencyCode = currencyCode || currencyCodes[0] || "usd"

  const getPickupLocationReason = (
    reason: PickupLocationUnavailabilityReason
  ) => {
    switch (reason) {
      case "disabled":
        return t("options.form.pickupLocationDisabled")
      case "already_assigned":
        return t("options.form.pickupLocationAlreadyAssigned")
      case "unavailable":
        return t("options.form.pickupLocationUnavailable")
    }
  }

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
      setPickupLocationId("")
      setPickupSelectionWarningReason(null)
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
      setPickupLocationId("")
      setPickupSelectionWarningReason(null)
      setAmount("")
      setCurrencyCode("")
    }
  }, [editOption, open])

  useEffect(() => {
    if (!open || !editOption || !pickupBindingData) return
    setPickupLocationId(pickupBindingData.pickup_location_id || "")
    setPickupSelectionWarningReason(null)
  }, [editOption, open, pickupBindingData])

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
    if (!open || !selectedStockLocationId || isFetchingProviders) return

    if (providers.length === 1 && providerId !== providers[0].id) {
      setProviderId(providers[0].id)
      return
    }

    if (
      providers.length > 1 &&
      providerId &&
      !providers.some((provider) => provider.id === providerId)
    ) {
      setProviderId("")
      return
    }

    if (providers.length === 0 && providerId) {
      setProviderId("")
    }
  }, [
    isFetchingProviders,
    open,
    providerId,
    providers,
    selectedStockLocationId,
  ])

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

  const handleSubmit = async () => {
    setSubmitError(null)
    const isPickup = metadataType === "pickup"
    if (
      isPickup &&
      (!pickupSelectionValidationReady || selectedPickupLocationReason)
    ) {
      if (selectedPickupLocationReason) {
        setPickupSelectionWarningReason(selectedPickupLocationReason)
      }
      return
    }
    if (
      !name.trim() ||
      (!editOption && !serviceZoneId) ||
      (!editOption && hasSelectedServiceZoneWithoutStockLocation) ||
      (!!selectedStockLocationId && (!providerId || hasNoAvailableProviders)) ||
      (metadataType === "pickup" && !pickupLocationId)
    ) {
      return
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      price_type: "flat",
      metadata: {
        ...(editOption?.metadata || {}),
        type: metadataType || "delivery",
      },
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

    let createdOptionId: string | null = null
    try {
      if (editOption) {
        await updateConfiguration.mutateAsync({
          shippingOption: payload,
          pickupLocationId: isPickup ? pickupLocationId : null,
        })
        onOpenChange(false)
        return
      }

      const result = await createOption.mutateAsync(payload)
      const optionId = result.shipping_option.id
      createdOptionId = optionId
      await syncPickupLocation.mutateAsync({
        optionId,
        pickupLocationId: isPickup ? pickupLocationId : null,
      })
      onOpenChange(false)
    } catch (error) {
      if (createdOptionId) {
        await adminFetch(`/admin/shipping-options/${createdOptionId}/safe`, {
          method: "DELETE",
        }).catch(() => undefined)
      }
      setSubmitError(
        error instanceof Error ? error : new Error(t("options.form.saveFailed"))
      )
    }
  }

  const isPending =
    createOption.isPending ||
    updateConfiguration.isPending ||
    syncPickupLocation.isPending
  const isSubmitDisabled =
    !name.trim() ||
    (!editOption &&
      (!serviceZoneId ||
        isLoadingOptionTypes ||
        hasSelectedServiceZoneWithoutStockLocation)) ||
    (!!selectedStockLocationId &&
      (!providerId || isFetchingProviders || hasNoAvailableProviders)) ||
    (metadataType === "pickup" &&
      (!pickupLocationId ||
        !pickupSelectionValidationReady ||
        !!selectedPickupLocationReason ||
        (!!editOption && isLoadingPickupBinding))) ||
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
              onChange={(e) => {
                setMetadataType(e.target.value as "pickup" | "delivery")
                setPickupSelectionWarningReason(null)
              }}
            >
              <option value="delivery">{t("options.form.typeDelivery")}</option>
              <option value="pickup">{t("options.form.typePickup")}</option>
            </Select>
          </div>

          {metadataType === "pickup" && (
            <div className="space-y-2">
              <Label htmlFor="pickup-location">
                {t("options.form.pickupLocation")}
              </Label>
              <Select
                id="pickup-location"
                value={pickupLocationId}
                onChange={(event) => {
                  setPickupLocationId(event.target.value)
                  setPickupSelectionWarningReason(null)
                }}
                disabled={
                  isLoadingPickupLocations ||
                  isPickupLocationsError ||
                  pickupLocationOptions.length === 0
                }
              >
                <option value="">
                  {isLoadingPickupLocations
                    ? t("options.form.loadingPickupLocations")
                    : t("options.form.selectPickupLocation")}
                </option>
                {pickupLocationOptions.map(({ location, reason }) => {
                  const label = `${location.name} - ${location.address}`
                  return (
                    <option
                      key={location.id}
                      value={location.id}
                      disabled={!!reason}
                    >
                      {reason
                        ? `${label} - ${getPickupLocationReason(reason)}`
                        : label}
                    </option>
                  )
                })}
              </Select>
              {isPickupLocationsError && (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-destructive">
                    {t("options.form.pickupLocationsLoadFailed")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isFetchingPickupLocations}
                    onClick={() => void refetchPickupLocations()}
                  >
                    {t("options.form.retryPickupLocations")}
                  </Button>
                </div>
              )}
              {pickupSelectionWarningReason && (
                <p className="text-xs text-destructive">
                  {t("options.form.pickupLocationSelectionInvalidated", {
                    reason: getPickupLocationReason(
                      pickupSelectionWarningReason
                    ),
                  })}
                </p>
              )}
              {!isLoadingPickupLocations &&
                !isPickupLocationsError &&
                pickupLocationOptions.length === 0 && (
                  <p className="text-xs text-destructive">
                    {t("options.form.noPickupLocations")}
                  </p>
                )}
              {!isLoadingPickupLocations &&
                !isPickupLocationsError &&
                pickupLocationOptions.length > 0 &&
                selectablePickupLocationCount === 0 && (
                  <p className="text-xs text-destructive">
                    {t("options.form.noEligiblePickupLocations")}
                  </p>
                )}
            </div>
          )}

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

          {shouldShowProviderSelect && (
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

          {shouldShowProviderHint && (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {t("options.form.noAvailableProviders")}
            </p>
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

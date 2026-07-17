"use client"

import { useState, useCallback, useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  type CartAddress,
  type RegionCountry,
  type ShippingOption,
  type PaymentMethod,
  getRegions,
  updateCartAddress,
  updateCartPickupContact,
  getShippingAvailability,
  transferCartToCustomer,
  setShippingMethod as setShippingMethodApi,
  initPaymentSessions,
  completeCart,
  removeCartId,
  getPaymentMethods,
  CartApiError,
  removeCheckoutIncompatibleItems,
} from "@/lib/cart"
import { useCart } from "@/lib/cart-store"
import { getToken, isAuthFailureStatus } from "@/lib/auth"
import {
  buildPickupCartContact,
  getCheckoutCartErrorTranslationKey,
  validatePickupContact,
} from "@/lib/checkout-contact"
import {
  CHECKOUT_REMOVAL_ERROR_CODES,
  getCheckoutRemovalError,
} from "@/lib/checkout-incompatible-removal"

export type Step = "shipping" | "info" | "payment-method" | "payment"

export interface CheckoutForm {
  email: string
  phone: string
  firstName: string
  lastName: string
  address1: string
  address2: string
  city: string
  postalCode: string
  countryCode: string
}

export interface CountryOption {
  code: string
  label: string
}

interface UseCheckoutReturn {
  step: Step
  form: CheckoutForm
  setForm: React.Dispatch<React.SetStateAction<CheckoutForm>>
  updateField: (field: keyof CheckoutForm, value: string) => void
  countryOptions: CountryOption[]
  shippingOptions: ShippingOption[]
  selectedShippingId: string | null
  selectShippingOption: (optionId: string) => void
  isPickupOption: (option: ShippingOption) => boolean
  isPickup: boolean
  clientSecret: string | null
  loading: boolean
  error: string | null
  submitInfo: () => Promise<void>
  submitShipping: (optionId: string) => void
  submitOrder: () => Promise<string>
  goBack: () => void
  fillFromSavedAddress: (addr: SavedAddress) => void
  paymentMethods: PaymentMethod[]
  selectedPaymentMethod: string | null
  selectPaymentMethod: (providerId: string) => Promise<void>
  setSelectedPaymentMethod: (id: string | null) => void
  selectedOption: ShippingOption | null
  incompatibleRemovalBlocked: boolean
  removeIncompatibleItem: (lineItemId: string) => Promise<void>
  removeAllIncompatibleItems: () => Promise<void>
}

export interface SavedAddress {
  id: string
  first_name: string
  last_name: string
  phone?: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
}

const PREFERRED_COUNTRY_CODE = "cn"

const FALLBACK_COUNTRIES: RegionCountry[] = [
  { iso_2: "cn", display_name: "China" },
  { iso_2: "gb", display_name: "United Kingdom" },
  { iso_2: "de", display_name: "Germany" },
  { iso_2: "dk", display_name: "Denmark" },
  { iso_2: "se", display_name: "Sweden" },
  { iso_2: "fr", display_name: "France" },
  { iso_2: "es", display_name: "Spain" },
  { iso_2: "it", display_name: "Italy" },
]

const initialForm: CheckoutForm = {
  email: "",
  phone: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  postalCode: "",
  countryCode: PREFERRED_COUNTRY_CODE,
}

const WOOSHPAY_PROVIDER_ID = "pp_wooshpay_wooshpay"

function isPickupOption(option: ShippingOption): boolean {
  return option.is_pickup
}

function getCountryLabel(country: RegionCountry, code: string, locale: string): string {
  try {
    const displayName = new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase())
    if (displayName) return displayName
  } catch {
    // Fall back to backend-provided labels below.
  }

  return country.display_name || country.name || code.toUpperCase()
}

function buildCountryOptions(countries: RegionCountry[], locale: string): CountryOption[] {
  const seen = new Set<string>()
  return countries.reduce<CountryOption[]>((options, country) => {
    const code = country.iso_2?.toLowerCase()
    if (!code || seen.has(code)) return options
    seen.add(code)
    options.push({
      code,
      label: getCountryLabel(country, code, locale),
    })
    return options
  }, [])
}

function getNextCountryCode(options: CountryOption[], current: string): string {
  const normalizedCurrent = current.toLowerCase()
  if (options.some((option) => option.code === normalizedCurrent)) return normalizedCurrent
  return options.find((option) => option.code === PREFERRED_COUNTRY_CODE)?.code
    ?? options[0]?.code
    ?? PREFERRED_COUNTRY_CODE
}

function isAuthError(error: unknown): boolean {
  return error instanceof Error && /\b(401|Unauthorized)\b/i.test(error.message)
}

export function useCheckout(): UseCheckoutReturn {
  const { cart, initCart } = useCart()
  const locale = useLocale()
  const t = useTranslations()
  const [step, setStep] = useState<Step>("shipping")
  const [form, setForm] = useState<CheckoutForm>(initialForm)
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>(() => (
    buildCountryOptions(FALLBACK_COUNTRIES, locale)
  ))
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const appliedShippingId = cart?.shipping_methods?.[0]?.shipping_option_id ?? null

  useEffect(() => {
    let cancelled = false

    async function loadCountryOptions() {
      const fallbackOptions = buildCountryOptions(FALLBACK_COUNTRIES, locale)
      try {
        const regions = await getRegions()
        if (cancelled) return

        const currentRegion = regions.find((region) => region.id === cart?.region_id)
        const regionWithCountries = currentRegion?.countries?.length
          ? currentRegion
          : regions.find((region) => region.countries?.length)
        const options = buildCountryOptions(regionWithCountries?.countries ?? [], locale)
        const nextOptions = options.length > 0 ? options : fallbackOptions

        setCountryOptions(nextOptions)
        setForm((prev) => ({
          ...prev,
          countryCode: getNextCountryCode(nextOptions, prev.countryCode),
        }))
      } catch {
        if (!cancelled) {
          setCountryOptions(fallbackOptions)
          setForm((prev) => ({
            ...prev,
            countryCode: getNextCountryCode(fallbackOptions, prev.countryCode),
          }))
        }
      }
    }

    loadCountryOptions()
    return () => { cancelled = true }
  }, [cart?.region_id, locale])

  useEffect(() => {
    let cancelled = false
    async function loadShippingOptions() {
      setLoading(true)
      try {
        if (getToken()) {
          try {
            await transferCartToCustomer()
          } catch (error) {
            if (isAuthError(error)) throw error
            // Non-auth attachment failures should not block guest-compatible checkout.
          }
        }
        if (cancelled) return
        await initCart()
        if (cancelled) return
        const availability = await getShippingAvailability()
        const options = availability.shipping_options
        if (cancelled) return
        setShippingOptions(options)
        setSelectedShippingId((prev) => (
          prev && options.some((option) => option.id === prev) ? prev : null
        ))
      } catch {
        if (!cancelled) setShippingOptions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadShippingOptions()
    return () => { cancelled = true }
  }, [initCart])

  useEffect(() => {
    if (selectedShippingId || !appliedShippingId || shippingOptions.length === 0) return
    if (shippingOptions.some((option) => option.id === appliedShippingId)) {
      setSelectedShippingId(appliedShippingId)
    }
  }, [appliedShippingId, selectedShippingId, shippingOptions])

  const updateField = useCallback((field: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const fillFromSavedAddress = useCallback((addr: SavedAddress) => {
    const countryCode = addr.country_code?.toLowerCase()
    setForm((prev) => ({
      ...prev,
      firstName: addr.first_name,
      lastName: addr.last_name,
      phone: addr.phone || prev.phone,
      address1: addr.address_1,
      address2: addr.address_2 || "",
      city: addr.city,
      postalCode: addr.postal_code,
      countryCode: countryCode && countryOptions.some((option) => option.code === countryCode)
        ? countryCode
        : prev.countryCode,
    }))
  }, [countryOptions])

  const selectShippingOption = useCallback((optionId: string) => {
    setError(null)
    setSelectedShippingId(optionId)
  }, [])

  const selectedOption = shippingOptions.find((option) => option.id === selectedShippingId) ?? null
  const isPickup = selectedOption ? isPickupOption(selectedOption) : false
  const incompatibleRemovalBlocked = getCheckoutRemovalError(
    (cart?.items ?? []).map((item) => item.id),
    selectedOption?.incompatible_items.map((item) => item.line_item_id) ?? [],
    selectedOption?.incompatible_items.map((item) => item.line_item_id) ?? []
  ) === CHECKOUT_REMOVAL_ERROR_CODES.KEEP_ONE

  const refreshShippingAvailability = useCallback(async () => {
    const availability = await getShippingAvailability()
    setShippingOptions(availability.shipping_options)
    setSelectedShippingId((current) =>
      current && availability.shipping_options.some((option) => option.id === current)
        ? current
        : null
    )
  }, [])

  const removeSelectedIncompatibleItems = useCallback(async (
    lineItemIds: string[]
  ) => {
    setLoading(true)
    setError(null)
    try {
      if (!selectedOption) {
        throw new Error(t("checkout_incompatible_items_changed"))
      }
      const validationError = getCheckoutRemovalError(
        (cart?.items ?? []).map((item) => item.id),
        selectedOption.incompatible_items.map((item) => item.line_item_id),
        lineItemIds
      )
      if (validationError === CHECKOUT_REMOVAL_ERROR_CODES.KEEP_ONE) {
        throw new Error(t("checkout_keep_one_item"))
      }
      if (validationError === CHECKOUT_REMOVAL_ERROR_CODES.ITEMS_CHANGED) {
        throw new Error(t("checkout_incompatible_items_changed"))
      }

      await removeCheckoutIncompatibleItems(selectedOption.id, lineItemIds)
      await initCart()
      await refreshShippingAvailability()
      setPaymentMethods([])
      setSelectedPaymentMethod(null)
      setClientSecret(null)
    } catch (error) {
      if (
        error instanceof CartApiError &&
        error.code === CHECKOUT_REMOVAL_ERROR_CODES.KEEP_ONE
      ) {
        setError(t("checkout_keep_one_item"))
      } else if (
        error instanceof CartApiError &&
        error.code === CHECKOUT_REMOVAL_ERROR_CODES.ITEMS_CHANGED
      ) {
        setError(t("checkout_incompatible_items_changed"))
      } else {
        setError(error instanceof Error ? error.message : "Failed to remove items")
      }
    } finally {
      setLoading(false)
    }
  }, [cart?.items, initCart, refreshShippingAvailability, selectedOption, t])

  const removeIncompatibleItem = useCallback(async (lineItemId: string) => {
    await removeSelectedIncompatibleItems([lineItemId])
  }, [removeSelectedIncompatibleItems])

  const removeAllIncompatibleItems = useCallback(async () => {
    const lineItemIds = selectedOption?.incompatible_items.map(
      (item) => item.line_item_id
    ) ?? []
    if (!lineItemIds.length) return
    await removeSelectedIncompatibleItems(lineItemIds)
  }, [removeSelectedIncompatibleItems, selectedOption])

  const submitInfo = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (!selectedShippingId || !selectedOption) {
        throw new Error("Please select a shipping method")
      }
      if (!selectedOption.is_compatible) {
        throw new Error("Remove incompatible items before continuing")
      }

      if (isPickupOption(selectedOption)) {
        const contactError = validatePickupContact(form)
        if (contactError === "first_name_required") {
          throw new Error(t("validation_first_name_required"))
        }
        if (contactError === "last_name_required") {
          throw new Error(t("validation_last_name_required"))
        }
        if (contactError === "phone_required") {
          throw new Error(t("validation_phone_required"))
        }
        if (contactError === "email_required") {
          throw new Error(t("validation_email_required"))
        }
        if (contactError === "email_invalid") {
          throw new Error(t("validation_email_invalid"))
        }
      }

      if (isPickupOption(selectedOption)) {
        await updateCartPickupContact(
          buildPickupCartContact(form),
          form.email.trim()
        )
      } else {
        const address: CartAddress = {
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            address_1: form.address1,
            address_2: form.address2,
            city: form.city,
            postal_code: form.postalCode,
            country_code: form.countryCode,
        }
        await updateCartAddress(address, form.email)
      }
      await setShippingMethodApi(selectedShippingId)
      await initCart()

      // Fetch available payment methods
      const methods = await getPaymentMethods()
      setPaymentMethods(methods)
      setStep("payment-method")
    } catch (e: any) {
      const translationKey = e instanceof CartApiError
        ? getCheckoutCartErrorTranslationKey(e.code)
        : null
      setError(
        translationKey
          ? t(translationKey)
          : e.message || "Failed to continue"
      )
    } finally {
      setLoading(false)
    }
  }, [form, initCart, selectedOption, selectedShippingId, t])

  const selectPaymentMethod = useCallback(async (providerId: string) => {
    setLoading(true)
    setError(null)
    setSelectedPaymentMethod(providerId)
    try {
      const paymentData = providerId === WOOSHPAY_PROVIDER_ID && cart?.id && typeof window !== "undefined"
        ? (() => {
            const returnUrl = new URL(window.location.href)
            returnUrl.pathname = `/${locale}/checkout/return`
            returnUrl.search = ""
            returnUrl.searchParams.set("cart_id", cart.id)

            const cancelUrl = new URL(returnUrl.toString())
            cancelUrl.searchParams.set("status", "cancelled")

            return {
              success_url: returnUrl.toString(),
              cancel_url: cancelUrl.toString(),
              payment_method_types: ["unionpay"],
            }
          })()
        : undefined
      const cartWithPayment = await initPaymentSessions(providerId, paymentData)
      const sessions = cartWithPayment.payment_collection?.payment_sessions
      const session = sessions?.find((s) => s.provider_id === providerId)
      const secret = (session?.data?.client_secret as string) ?? null
      // For providers without client_secret (e.g. WooShPay), store full session data
      setClientSecret(secret || (session?.data ? JSON.stringify(session.data) : null))
      await initCart()
      setStep("payment")
    } catch (e: any) {
      setError(e.message || "Failed to initialize payment")
    } finally {
      setLoading(false)
    }
  }, [cart?.id, initCart, locale])

  const submitShipping = useCallback((optionId: string) => {
    setError(null)
    const option = shippingOptions.find((candidate) => candidate.id === optionId)
    if (!option?.is_compatible) {
      setError("Remove incompatible items before continuing")
      return
    }
    setSelectedShippingId(option.id)
    setStep("info")
  }, [shippingOptions])

  const submitOrder = useCallback(async (): Promise<string> => {
    setLoading(true)
    setError(null)
    try {
      const result = await completeCart()
      if (result.type === "order" && result.order) {
        removeCartId()
        await initCart()
        return result.order.id
      }
      throw new Error(result.error || "Failed to complete order")
    } catch (e: any) {
      if (isAuthFailureStatus((e as { status?: number }).status ?? 0) || isAuthError(e)) {
        setError("Your login session has expired. Please sign in again before placing the order.")
      } else {
        setError(e.message || "Failed to complete order")
      }
      throw e
    } finally {
      setLoading(false)
    }
  }, [initCart])

  const goBack = useCallback(() => {
    setError(null)
    if (step === "payment") setStep("payment-method")
    else if (step === "payment-method") setStep("info")
    else if (step === "info") setStep("shipping")
  }, [step])

  return {
    step, form, setForm, updateField,
    countryOptions,
    shippingOptions, selectedShippingId, selectShippingOption, isPickupOption, isPickup, clientSecret,
    selectedOption, incompatibleRemovalBlocked,
    removeIncompatibleItem, removeAllIncompatibleItems,
    loading, error,
    submitInfo, submitShipping, submitOrder, goBack, fillFromSavedAddress,
    paymentMethods, selectedPaymentMethod, selectPaymentMethod, setSelectedPaymentMethod,
  }
}

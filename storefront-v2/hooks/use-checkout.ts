"use client"

import { useState, useCallback, useEffect } from "react"
import {
  type CartAddress,
  type ShippingOption,
  updateCartAddress,
  getShippingOptions,
  setShippingMethod as setShippingMethodApi,
  initPaymentSessions,
  completeCart,
  removeCartId,
} from "@/lib/cart"
import { useCart } from "@/lib/cart-store"

export type Step = "shipping" | "info" | "payment"

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

interface UseCheckoutReturn {
  step: Step
  form: CheckoutForm
  setForm: React.Dispatch<React.SetStateAction<CheckoutForm>>
  updateField: (field: keyof CheckoutForm, value: string) => void
  shippingOptions: ShippingOption[]
  selectedShippingId: string | null
  selectShippingOption: (optionId: string) => void
  isPickup: boolean
  clientSecret: string | null
  loading: boolean
  error: string | null
  submitInfo: () => Promise<void>
  submitShipping: (optionId: string) => void
  submitOrder: () => Promise<string>
  goBack: () => void
  fillFromSavedAddress: (addr: SavedAddress) => void
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

const initialForm: CheckoutForm = {
  email: "",
  phone: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  postalCode: "",
  countryCode: "gb",
}

function isPickupOption(option: ShippingOption): boolean {
  if (option.metadata?.type) {
    return option.metadata.type.toLowerCase() === "pickup"
  }

  // Fallback for options returned without metadata.type.
  const name = option.name?.toLowerCase() ?? ""
  return name.includes("自提") || name.includes("pickup") || name.includes("pick-up") || name.includes("self-pick")
}

export function useCheckout(): UseCheckoutReturn {
  const { cart, initCart } = useCart()
  const [step, setStep] = useState<Step>("shipping")
  const [form, setForm] = useState<CheckoutForm>(initialForm)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const appliedShippingId = cart?.shipping_methods?.[0]?.shipping_option_id ?? null

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    getShippingOptions()
      .then((options) => {
        if (cancelled) return
        setShippingOptions(options)
        setSelectedShippingId((prev) => (
          prev && options.some((option) => option.id === prev) ? prev : null
        ))
      })
      .catch(() => {
        if (!cancelled) setShippingOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

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
    setForm((prev) => ({
      ...prev,
      firstName: addr.first_name,
      lastName: addr.last_name,
      phone: addr.phone || prev.phone,
      address1: addr.address_1,
      address2: addr.address_2 || "",
      city: addr.city,
      postalCode: addr.postal_code,
      countryCode: addr.country_code?.toLowerCase() || prev.countryCode,
    }))
  }, [])

  const selectShippingOption = useCallback((optionId: string) => {
    setError(null)
    setSelectedShippingId(optionId)
  }, [])

  const selectedOption = shippingOptions.find((option) => option.id === selectedShippingId) ?? null
  const isPickup = selectedOption ? isPickupOption(selectedOption) : false

  const submitInfo = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (!selectedShippingId || !selectedOption) {
        throw new Error("Please select a shipping method")
      }

      const address: CartAddress = isPickupOption(selectedOption)
        ? {
            first_name: form.firstName.trim() || "Pickup",
            last_name: form.lastName.trim() || "Customer",
            phone: form.phone,
            address_1: "Pickup Order",
            address_2: selectedOption.name,
            city: "Pickup",
            postal_code: "000000",
            country_code: form.countryCode || initialForm.countryCode,
          }
        : {
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
      await setShippingMethodApi(selectedShippingId)
      const cartWithPayment = await initPaymentSessions("pp_stripe_stripe")
      const sessions = cartWithPayment.payment_collection?.payment_sessions
      const stripeSession = sessions?.find((s) => s.provider_id === "pp_stripe_stripe")
      const secret = stripeSession?.data?.client_secret as string | undefined
      if (!secret) throw new Error("Failed to get Stripe client secret")
      setClientSecret(secret)
      await initCart()
      setStep("payment")
    } catch (e: any) {
      setError(e.message || "Failed to continue to payment")
    } finally {
      setLoading(false)
    }
  }, [form, initCart, selectedOption, selectedShippingId])

  const submitShipping = useCallback((optionId: string) => {
    setError(null)
    setSelectedShippingId(optionId)
    setStep("info")
  }, [])

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
      setError(e.message || "Failed to complete order")
      throw e
    } finally {
      setLoading(false)
    }
  }, [initCart])

  const goBack = useCallback(() => {
    setError(null)
    if (step === "payment") setStep("info")
    else if (step === "info") setStep("shipping")
  }, [step])

  return {
    step, form, setForm, updateField,
    shippingOptions, selectedShippingId, selectShippingOption, isPickup, clientSecret,
    loading, error,
    submitInfo, submitShipping, submitOrder, goBack, fillFromSavedAddress,
  }
}

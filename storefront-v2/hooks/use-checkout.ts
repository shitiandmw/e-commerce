"use client"

import { useState, useCallback } from "react"
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

export type Step = "info" | "shipping" | "payment"

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
  clientSecret: string | null
  loading: boolean
  error: string | null
  submitInfo: () => Promise<void>
  submitShipping: (optionId: string) => Promise<void>
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

export function useCheckout(): UseCheckoutReturn {
  const { initCart } = useCart()
  const [step, setStep] = useState<Step>("info")
  const [form, setForm] = useState<CheckoutForm>(initialForm)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const submitInfo = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
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
      const options = await getShippingOptions()
      setShippingOptions(options)
      if (options.length > 0) setSelectedShippingId(options[0].id)
      await initCart()
      setStep("shipping")
    } catch (e: any) {
      setError(e.message || "Failed to update address")
    } finally {
      setLoading(false)
    }
  }, [form, initCart])

  const submitShipping = useCallback(async (optionId: string) => {
    setLoading(true)
    setError(null)
    try {
      setSelectedShippingId(optionId)
      await setShippingMethodApi(optionId)
      const cartWithPayment = await initPaymentSessions("pp_stripe_stripe")
      const sessions = cartWithPayment.payment_collection?.payment_sessions
      const stripeSession = sessions?.find((s) => s.provider_id === "pp_stripe_stripe")
      const secret = stripeSession?.data?.client_secret as string | undefined
      if (!secret) throw new Error("Failed to get Stripe client secret")
      setClientSecret(secret)
      await initCart()
      setStep("payment")
    } catch (e: any) {
      setError(e.message || "Failed to set shipping method")
    } finally {
      setLoading(false)
    }
  }, [initCart])

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
    if (step === "payment") setStep("shipping")
    else if (step === "shipping") setStep("info")
  }, [step])

  return {
    step, form, setForm, updateField,
    shippingOptions, selectedShippingId, clientSecret,
    loading, error,
    submitInfo, submitShipping, submitOrder, goBack, fillFromSavedAddress,
  }
}

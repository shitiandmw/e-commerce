"use client"

import { useState } from "react"
import Image from "next/image"
import { Link, useRouter } from "@/i18n/navigation"
import {
  ChevronLeft,
  ChevronDown,
  Lock,
  Truck,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { useCart, getCartProductName, getCartProductImage } from "@/lib/cart-store"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { useCheckout, type Step } from "@/hooks/use-checkout"
import { SavedAddresses } from "@/components/checkout/saved-addresses"
import { StripePayment } from "@/components/checkout/stripe-payment"

/* ─── step definitions ─── */
const steps: { key: Step; labelKey: string; num: number }[] = [
  { key: "info", labelKey: "checkout_contact_title", num: 1 },
  { key: "shipping", labelKey: "checkout_shipping_method", num: 2 },
  { key: "payment", labelKey: "checkout_payment_method", num: 3 },
]

/* ─── shared input ─── */
function FormInput({
  label, id, type = "text", placeholder, required = false, half = false,
  value, onChange,
}: {
  label: string; id: string; type?: string; placeholder?: string
  required?: boolean; half?: boolean; value?: string; onChange?: (v: string) => void
}) {
  return (
    <div className={half ? "flex-1 min-w-0" : ""}>
      <label htmlFor={id} className="block text-xs text-foreground/70 mb-1.5">
        {label}
        {required && <span className="text-gold ml-0.5">*</span>}
      </label>
      <input
        id={id} type={type} placeholder={placeholder} required={required}
        value={value ?? ""} onChange={(e) => onChange?.(e.target.value)}
        className="w-full h-10 bg-background border border-border/50 rounded-sm px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/50 transition-colors"
      />
    </div>
  )
}
/* ─── step indicator ─── */
function StepIndicator({ current, t }: { current: Step; t: (key: string) => string }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => {
        const isActive = s.key === current
        const isDone = steps.findIndex((x) => x.key === current) > i
        return (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && (
              <div className={cn("w-8 h-px", isDone ? "bg-gold" : "bg-border/50")} />
            )}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-6 flex items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                  isActive
                    ? "bg-gold text-primary-foreground"
                    : isDone
                      ? "bg-gold/20 text-gold"
                      : "bg-secondary text-muted-foreground"
                )}
              >
                {isDone ? <CheckCircle2 className="size-3.5" /> : s.num}
              </span>
              <span
                className={cn(
                  "text-xs hidden sm:block transition-colors",
                  isActive ? "text-gold" : isDone ? "text-foreground/50" : "text-muted-foreground/50"
                )}
              >
                {t(s.labelKey)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
/* ═══════════════ CHECKOUT PAGE ═══════════════ */
export default function CheckoutPage() {
  const router = useRouter()
  const { cart } = useCart()
  const items = cart?.items ?? []
  const checkout = useCheckout()
  const { step, form, updateField, loading, error } = checkout
  const [showOrderSummary, setShowOrderSummary] = useState(false)

  const t = useTranslations()

  const subtotal = cart?.item_total ?? 0
  const shippingCost = cart?.shipping_total ?? 0
  const hasShipping = step !== "info"
  const total = cart?.total ?? subtotal
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  const currencyCode = cart?.currency_code || "usd"

  const fmtPrice = (amount: number) => formatPrice(amount, currencyCode)

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-xl font-serif text-foreground mb-4">{t("checkout_empty_cart")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("checkout_empty_cart_desc")}</p>
        <Link
          href="/category/cuban-cigars"
          className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-gold-light transition-colors"
        >
          {t("explore_cigars")}
        </Link>
      </div>
    )
  }

  const handlePaymentSuccess = async () => {
    try {
      const orderId = await checkout.submitOrder()
      router.push(`/checkout/success?order_id=${orderId}`)
    } catch {
      // error is set in useCheckout
    }
  }
  return (
    <div className="min-h-screen bg-background">
      {/* checkout header */}
      <div className="border-b border-border/30 bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link
            href="/cart"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            <ChevronLeft className="size-4" />
            {t("checkout_back_to_cart")}
          </Link>
          <Link href="/" className="text-lg font-serif font-bold tracking-[0.15em] text-gold">
            TIMECIGAR
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5 text-gold/60" />
            <span className="hidden sm:inline">{t("checkout_secure")}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* left: form area */}
          <div className="flex-1 min-w-0">
            <StepIndicator current={step} t={t} />

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}
            {/* ── step 1: info ── */}
            {step === "info" && (
              <div>
                <h2 className="text-lg font-serif text-foreground mb-6">{t("checkout_contact_title")}</h2>

                <SavedAddresses onSelect={checkout.fillFromSavedAddress} />

                {/* contact */}
                <div className="mb-8">
                  <h3 className="text-xs text-gold uppercase tracking-widest mb-4">{t("checkout_contact_method")}</h3>
                  <div className="flex flex-col gap-4">
                    <FormInput label={t("checkout_email_label")} id="email" type="email" placeholder="your@email.com" required value={form.email} onChange={(v) => updateField("email", v)} />
                    <FormInput label={t("checkout_phone_label")} id="phone" type="tel" placeholder="+852 xxxx xxxx" required value={form.phone} onChange={(v) => updateField("phone", v)} />
                  </div>
                </div>

                {/* shipping address */}
                <div>
                  <h3 className="text-xs text-gold uppercase tracking-widest mb-4">{t("checkout_shipping_address")}</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <FormInput label={t("checkout_first_name")} id="first-name" placeholder={t("checkout_first_name")} required half value={form.firstName} onChange={(v) => updateField("firstName", v)} />
                      <FormInput label={t("checkout_last_name")} id="last-name" placeholder={t("checkout_last_name")} required half value={form.lastName} onChange={(v) => updateField("lastName", v)} />
                    </div>
                    <FormInput label={t("checkout_address_line1")} id="address1" placeholder={t("street_address")} required value={form.address1} onChange={(v) => updateField("address1", v)} />
                    <FormInput label={t("checkout_address_line2")} id="address2" placeholder={t("checkout_address_line2_placeholder")} value={form.address2} onChange={(v) => updateField("address2", v)} />
                    <div className="flex gap-4">
                      <FormInput label={t("checkout_city")} id="city" placeholder={t("checkout_city")} required half value={form.city} onChange={(v) => updateField("city", v)} />
                      <FormInput label={t("checkout_postal_code")} id="zip" placeholder="000000" half value={form.postalCode} onChange={(v) => updateField("postalCode", v)} />
                    </div>
                    <div>
                      <label htmlFor="country" className="block text-xs text-foreground/70 mb-1.5">
                        {t("checkout_country")}<span className="text-gold ml-0.5">*</span>
                      </label>
                      <select
                        id="country"
                        value={form.countryCode}
                        onChange={(e) => updateField("countryCode", e.target.value)}
                        className="w-full h-10 bg-background border border-border/50 rounded-sm px-3 text-sm text-foreground focus:outline-none focus:border-gold/50 transition-colors appearance-none"
                      >
                        <option value="gb">{t("checkout_country_uk")}</option>
                        <option value="de">Germany</option>
                        <option value="dk">Denmark</option>
                        <option value="se">Sweden</option>
                        <option value="fr">France</option>
                        <option value="es">Spain</option>
                        <option value="it">Italy</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* ── step 2: shipping ── */}
            {step === "shipping" && (
              <div>
                <h2 className="text-lg font-serif text-foreground mb-6">{t("checkout_shipping_method")}</h2>
                {checkout.shippingOptions.length === 0 ? (
                  loading ? (
                    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin mr-2" />
                      {t("checkout_loading")}
                    </div>
                  ) : (
                    <div className="rounded-md border border-border/30 p-6 text-center">
                      <Truck className="size-6 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {t("checkout_no_shipping_options")}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-3">
                    {checkout.shippingOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => checkout.submitShipping(opt.id)}
                        disabled={loading}
                        className={cn(
                          "flex items-center justify-between p-4 border transition-colors text-left",
                          checkout.selectedShippingId === opt.id
                            ? "border-gold/50 bg-gold/5"
                            : "border-border/30 hover:border-gold/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "size-4 rounded-full border-2 flex items-center justify-center",
                              checkout.selectedShippingId === opt.id ? "border-gold" : "border-border/50"
                            )}
                          >
                            {checkout.selectedShippingId === opt.id && <div className="size-2 rounded-full bg-gold" />}
                          </div>
                          <div>
                            <p className="text-sm text-foreground">{opt.name}</p>
                          </div>
                        </div>
                        <span className={cn("text-sm font-medium", opt.amount === 0 ? "text-gold" : "text-foreground")}>
                          {opt.amount === 0 ? t("checkout_free_label") : fmtPrice(opt.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-8 p-4 bg-secondary/30 border border-border/20 flex items-start gap-3">
                  <Truck className="size-4 text-gold/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-foreground/70">{t("checkout_shipping_note_title")}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{t("checkout_shipping_note_desc")}</p>
                  </div>
                </div>
              </div>
            )}
            {/* ── step 3: payment ── */}
            {step === "payment" && checkout.clientSecret && (
              <div>
                <h2 className="text-lg font-serif text-foreground mb-6">{t("checkout_payment_method")}</h2>
                <StripePayment
                  clientSecret={checkout.clientSecret}
                  onSuccess={handlePaymentSuccess}
                  totalLabel={t("checkout_confirm_payment", { total: fmtPrice(total) })}
                />

                {/* terms */}
                <label className="flex items-start gap-3 mt-6 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-[#c8a96e]" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {t("checkout_terms_agree")}
                    <Link href="/terms" className="text-gold hover:underline mx-0.5">{t("checkout_terms")}</Link>
                    {t("checkout_and")}
                    <Link href="/privacy" className="text-gold hover:underline mx-0.5">{t("checkout_privacy")}</Link>
                    。
                  </span>
                </label>
              </div>
            )}
            {/* navigation buttons — only for info step; shipping selects directly; payment has its own submit */}
            {step === "info" && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/20">
                <Link
                  href="/cart"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  <ChevronLeft className="size-4" />
                  {t("checkout_back_to_cart")}
                </Link>
                <button
                  onClick={checkout.submitInfo}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gold text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  {t("checkout_continue")}
                </button>
              </div>
            )}

            {(step === "shipping" || step === "payment") && (
              <div className="flex items-center mt-8 pt-6 border-t border-border/20">
                <button
                  onClick={checkout.goBack}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  <ChevronLeft className="size-4" />
                  {t("checkout_prev_step")}
                </button>
              </div>
            )}
          </div>
          {/* right: order summary sidebar */}
          <div className="lg:w-[360px] shrink-0">
            {/* mobile toggle */}
            <button
              onClick={() => setShowOrderSummary(!showOrderSummary)}
              className="lg:hidden flex items-center justify-between w-full p-4 bg-card border border-border/30 mb-4"
            >
              <span className="text-sm text-foreground">{t("checkout_order_summary", { count: itemCount })}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gold">{fmtPrice(total)}</span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showOrderSummary && "rotate-180")} />
              </div>
            </button>

            <div className={cn("lg:block", showOrderSummary ? "block" : "hidden")}>
              <div className="sticky top-20 bg-card border border-border/30 p-5">
                <h3 className="text-sm font-medium text-foreground mb-4 tracking-wide">{t("checkout_order_content")}</h3>

                {/* items */}
                <div className="flex flex-col gap-4 max-h-[320px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative size-14 bg-secondary/30 shrink-0">
                        <Image
                          src={getCartProductImage(item)}
                          alt={getCartProductName(item)}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute -top-1.5 -right-1.5 size-5 flex items-center justify-center bg-gold text-[9px] font-bold text-primary-foreground rounded-full">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground line-clamp-1">{getCartProductName(item)}</p>
                        {item.variant_title && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.variant_title}</p>
                        )}
                        <p className="text-xs text-gold mt-1">{fmtPrice(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* totals */}
                <div className="border-t border-border/30 mt-4 pt-4 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("subtotal")}</span>
                    <span className="text-foreground">{fmtPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("shipping")}</span>
                    <span className={!hasShipping ? "text-muted-foreground" : shippingCost === 0 ? "text-gold" : "text-foreground"}>
                      {!hasShipping ? t("checkout_to_be_calculated") : shippingCost === 0 ? t("checkout_free_label") : fmtPrice(shippingCost)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border/30 mt-3 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-foreground">{t("total")}</span>
                    <span className="text-lg font-bold text-gold">{fmtPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

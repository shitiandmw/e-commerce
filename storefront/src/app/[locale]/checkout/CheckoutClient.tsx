"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { isLoggedIn, getCustomer, getToken } from "@/lib/auth"
import { useLocale } from "@/lib/useLocale"
import {
  Cart, CartAddress, ShippingOption,
  getOrCreateCart, updateCartAddress, getShippingOptions, setShippingMethod,
  applyPromoCode as applyPromo, removePromoCode as removePromo,
  initPaymentSessions, completeCart, removeCartId,
} from "@/lib/cart"

const EMPTY_ADDRESS: CartAddress = {
  first_name: "", last_name: "", phone: "",
  address_1: "", address_2: "", city: "",
  province: "", postal_code: "", country_code: "de",
}

function formatPrice(amount: number | undefined, currency?: string) {
  if (amount == null) return "¥0.00"
  const c = (currency || "eur").toUpperCase()
  const sym = c === "CNY" ? "¥" : c === "USD" ? "$" : "€"
  return `${sym}${amount.toFixed(2)}`
}

/* ─── Test card validation (simulated Stripe) ─── */
const TEST_CARDS: Record<string, { status: "success" | "decline"; message?: string }> = {
  "4242424242424242": { status: "success" },
  "4000000000000002": { status: "decline", message: "Your card was declined." },
  "4000000000009995": { status: "decline", message: "Your card has insufficient funds." },
  "4000000000000069": { status: "decline", message: "Your card has expired." },
  "4000000000000127": { status: "decline", message: "Your card's security code is incorrect." },
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ")
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length > 2) return digits.slice(0, 2) + " / " + digits.slice(2)
  return digits
}

/* ─── Simulated Stripe Payment Form ─── */
function SimulatedStripeForm({ cart, onSuccess, onCancel }: {
  cart: Cart
  onSuccess: (orderId: string, displayId?: number) => void
  onCancel: () => void
}) {
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [cardName, setCardName] = useState("")
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")

  const cardDigits = cardNumber.replace(/\s/g, "")
  const expiryDigits = expiry.replace(/\D/g, "")
  const isFormValid = cardDigits.length === 16 && expiryDigits.length === 4 && cvc.length >= 3 && cardName.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    setPaying(true)
    setError("")

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500))

    const testCard = TEST_CARDS[cardDigits]
    if (!testCard) {
      setError("无法识别的测试卡号。请使用 4242 4242 4242 4242 (成功) 或 4000 0000 0000 0002 (拒绝)")
      setPaying(false)
      return
    }

    if (testCard.status === "decline") {
      setError(testCard.message || "支付被拒绝")
      setPaying(false)
      return
    }

    // Card accepted — complete the cart via Medusa
    try {
      const result = await completeCart()
      if (result.type === "order" && result.order) {
        removeCartId()
        onSuccess(result.order.id, result.order.display_id)
      } else {
        removeCartId()
        onSuccess("", undefined)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "完成订单失败，请重试")
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-[#e0e0e0] bg-white p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <svg width="32" height="20" viewBox="0 0 32 20" fill="none"><rect width="32" height="20" rx="3" fill="#635BFF"/><path d="M15.2 7.2c0-.8.7-1.1 1.7-1.1 1.5 0 3.4.5 4.9 1.3V3.8c-1.6-.7-3.3-1-4.9-1-4 0-6.7 2.1-6.7 5.6 0 5.5 7.5 4.6 7.5 7 0 .9-.8 1.2-1.9 1.2-1.6 0-3.7-.7-5.4-1.6v3.7c1.8.8 3.7 1.1 5.4 1.1 4.1 0 6.9-2 6.9-5.6-.1-5.9-7.5-4.9-7.5-7" fill="#fff"/></svg>
          <span className="text-sm font-medium text-gray-500">Test Mode</span>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">卡号</label>
          <input value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="4242 4242 4242 4242" maxLength={19} data-testid="card-number"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">有效期</label>
            <input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM / YY" maxLength={7} data-testid="card-expiry"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">CVC</label>
            <input value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="123" maxLength={4} data-testid="card-cvc"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">持卡人</label>
            <input value={cardName} onChange={e => setCardName(e.target.value)}
              placeholder="姓名" data-testid="card-name"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]" />
          </div>
        </div>
      </div>
      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600" data-testid="payment-error">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} disabled={paying}
          className="rounded border border-border px-6 py-2 text-sm font-medium hover:bg-muted/20 disabled:opacity-50">
          返回修改
        </button>
        <button type="submit" disabled={!isFormValid || paying}
          className="flex-1 rounded bg-[#635BFF] px-6 py-2 text-sm font-medium text-white hover:bg-[#5851ea] disabled:opacity-50">
          {paying ? "处理中..." : `支付 ${formatPrice(cart.total, cart.currency_code)}`}
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center">
        测试卡号: 4242 4242 4242 4242 (成功) | 4000 0000 0000 0002 (拒绝)
      </p>
    </form>
  )
}

/* ─── Main Checkout Component ─── */
export default function CheckoutClient() {
  const router = useRouter()
  const locale = useLocale()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")

  // Address
  const [address, setAddress] = useState<CartAddress>({ ...EMPTY_ADDRESS })
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({})
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [addressSaving, setAddressSaving] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<CartAddress[]>([])

  // Shipping
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<string>("")
  const [shippingLoading, setShippingLoading] = useState(false)
  const [noShippingMsg, setNoShippingMsg] = useState("")

  // Promo
  const [promoCode, setPromoCode] = useState("")
  const [promoError, setPromoError] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [appliedCodes, setAppliedCodes] = useState<string[]>([])

  // Payment
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  const [showPayment, setShowPayment] = useState(false)

  // Load cart and customer data
  useEffect(() => {
    async function init() {
      if (!isLoggedIn()) { router.replace(`/${locale}/login?redirect=/${locale}/checkout`); return }
      try {
        const c = await getOrCreateCart()
        setCart(c)
        if (c.promotions?.length) setAppliedCodes(c.promotions.map(p => p.code))
        if (c.shipping_address) { setAddress(c.shipping_address); setAddressConfirmed(true) }
        const customer = await getCustomer()
        if (customer?.email) setEmail(customer.email)
        const token = getToken()
        if (token) {
          try {
            const res = await fetch("/api/account/addresses", { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) {
              const data = await res.json()
              if (data.addresses?.length) setSavedAddresses(data.addresses)
            }
          } catch {}
        }
      } catch (e) { console.error("Checkout init error:", e) }
      setLoading(false)
    }
    init()
  }, [router])

  // Fetch shipping options when address is confirmed
  useEffect(() => {
    if (!addressConfirmed || !cart?.id) return
    setShippingLoading(true)
    setNoShippingMsg("")
    getShippingOptions()
      .then(opts => {
        setShippingOptions(opts)
        if (!opts.length) setNoShippingMsg("当前地址暂无可用配送方式")
        if (opts.length === 1) setSelectedShipping(opts[0].id)
      })
      .catch(() => setNoShippingMsg("获取配送方式失败"))
      .finally(() => setShippingLoading(false))
  }, [addressConfirmed, cart?.id])

  const validateAddress = useCallback(() => {
    const errs: Record<string, string> = {}
    if (!address.first_name.trim()) errs.first_name = "请填写姓"
    if (!address.last_name.trim()) errs.last_name = "请填写名"
    if (!address.address_1.trim()) errs.address_1 = "请填写地址"
    if (!address.city.trim()) errs.city = "请填写城市"
    if (!address.postal_code.trim()) errs.postal_code = "请填写邮编"
    if (!address.country_code.trim()) errs.country_code = "请选择国家"
    setAddressErrors(errs)
    return Object.keys(errs).length === 0
  }, [address])

  const handleConfirmAddress = async () => {
    if (!validateAddress()) return
    setAddressSaving(true)
    try {
      const updated = await updateCartAddress(address, email)
      setCart(updated)
      setAddressConfirmed(true)
    } catch (e: unknown) {
      setAddressErrors({ _general: e instanceof Error ? e.message : "保存地址失败" })
    }
    setAddressSaving(false)
  }

  const handleSelectShipping = async (optionId: string) => {
    setSelectedShipping(optionId)
    try {
      const updated = await setShippingMethod(optionId)
      setCart(updated)
    } catch (e) { console.error("Set shipping error:", e) }
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true); setPromoError("")
    try {
      const updated = await applyPromo(promoCode.trim())
      setCart(updated)
      setAppliedCodes(updated.promotions?.map(p => p.code) || [...appliedCodes, promoCode.trim()])
      setPromoCode("")
    } catch { setPromoError("优惠码无效或已过期") }
    setPromoLoading(false)
  }

  const handleRemovePromo = async (code: string) => {
    try {
      const updated = await removePromo(code)
      setCart(updated)
      setAppliedCodes(updated.promotions?.map(p => p.code) || appliedCodes.filter(c => c !== code))
    } catch (e) { console.error("Remove promo error:", e) }
  }

  const handleUseSavedAddress = (addr: CartAddress) => {
    setAddress({ ...addr })
    setAddressConfirmed(false)
    setAddressErrors({})
  }

  // Initialize payment session and show card form
  const handleProceedToPayment = async () => {
    if (!selectedShipping) return
    setPaymentLoading(true)
    setPaymentError("")
    try {
      await initPaymentSessions()
      setShowPayment(true)
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : "初始化支付失败")
    }
    setPaymentLoading(false)
  }

  const handlePaymentSuccess = (orderId: string, displayId?: number) => {
    const params = new URLSearchParams()
    if (orderId) params.set("order_id", orderId)
    if (displayId) params.set("display_id", String(displayId))
    router.push(`/checkout/success?${params.toString()}`)
  }

  const handlePaymentCancel = () => {
    setShowPayment(false)
  }

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-muted">加载中...</p></div>
  if (!cart || !cart.items?.length) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">结算</h1>
        <p className="text-muted mb-4">购物车为空</p>
        <Link href={`/${locale}/products`} className="text-accent hover:underline">继续购物</Link>
      </div>
    )
  }

  const currency = cart.currency_code
  const canPay = addressConfirmed && selectedShipping && !showPayment

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-foreground">结算</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Saved Addresses */}
          {savedAddresses.length > 0 && !addressConfirmed && !showPayment && (
            <section className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">已保存的地址</h2>
              <div className="space-y-2">
                {savedAddresses.map((a, i) => (
                  <button key={i} onClick={() => handleUseSavedAddress(a)}
                    className="w-full text-left rounded border border-border p-3 hover:bg-muted/20 transition">
                    <p className="font-medium">{a.first_name} {a.last_name}</p>
                    <p className="text-sm text-muted">{a.address_1}, {a.city} {a.postal_code}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Address Form */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">收货地址</h2>
            {addressConfirmed ? (
              <div>
                <p>{address.first_name} {address.last_name}</p>
                <p className="text-sm text-muted">{address.address_1}, {address.city} {address.postal_code}</p>
                {!showPayment && <button onClick={() => setAddressConfirmed(false)} className="mt-2 text-sm text-accent hover:underline">修改地址</button>}
              </div>
            ) : (
              <div className="space-y-4">
                {addressErrors._general && <p className="text-sm text-red-500">{addressErrors._general}</p>}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">姓 *</label>
                    <input value={address.first_name} onChange={e => setAddress(p => ({ ...p, first_name: e.target.value }))}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm" placeholder="姓" />
                    {addressErrors.first_name && <p className="mt-1 text-xs text-red-500">{addressErrors.first_name}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">名 *</label>
                    <input value={address.last_name} onChange={e => setAddress(p => ({ ...p, last_name: e.target.value }))}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm" placeholder="名" />
                    {addressErrors.last_name && <p className="mt-1 text-xs text-red-500">{addressErrors.last_name}</p>}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">地址 *</label>
                  <input value={address.address_1} onChange={e => setAddress(p => ({ ...p, address_1: e.target.value }))}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm" placeholder="街道地址" />
                  {addressErrors.address_1 && <p className="mt-1 text-xs text-red-500">{addressErrors.address_1}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">城市 *</label>
                    <input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm" placeholder="城市" />
                    {addressErrors.city && <p className="mt-1 text-xs text-red-500">{addressErrors.city}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">邮编 *</label>
                    <input value={address.postal_code} onChange={e => setAddress(p => ({ ...p, postal_code: e.target.value }))}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm" placeholder="邮编" />
                    {addressErrors.postal_code && <p className="mt-1 text-xs text-red-500">{addressErrors.postal_code}</p>}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">国家 *</label>
                  <select value={address.country_code} onChange={e => setAddress(p => ({ ...p, country_code: e.target.value }))}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
                    <option value="de">德国</option><option value="fr">法国</option>
                    <option value="gb">英国</option><option value="it">意大利</option>
                    <option value="es">西班牙</option><option value="se">瑞典</option>
                    <option value="dk">丹麦</option>
                  </select>
                  {addressErrors.country_code && <p className="mt-1 text-xs text-red-500">{addressErrors.country_code}</p>}
                </div>
                <button onClick={handleConfirmAddress} disabled={addressSaving}
                  className="rounded bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50">
                  {addressSaving ? "保存中..." : "确认地址"}
                </button>
              </div>
            )}
          </section>

          {/* Shipping Options */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">配送方式</h2>
            {!addressConfirmed ? (
              <p className="text-sm text-muted">请先确认收货地址</p>
            ) : shippingLoading ? (
              <p className="text-sm text-muted">加载配送方式...</p>
            ) : noShippingMsg ? (
              <p className="text-sm text-red-500">{noShippingMsg}</p>
            ) : showPayment ? (
              <p className="text-sm text-muted">{shippingOptions.find(o => o.id === selectedShipping)?.name || "已选择"}</p>
            ) : (
              <div className="space-y-2">
                {shippingOptions.map(opt => (
                  <label key={opt.id} className={`flex cursor-pointer items-center justify-between rounded border p-3 transition ${selectedShipping === opt.id ? "border-accent bg-accent/5" : "border-border hover:bg-muted/20"}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="shipping" checked={selectedShipping === opt.id}
                        onChange={() => handleSelectShipping(opt.id)} className="accent-accent" />
                      <span className="text-sm font-medium">{opt.name}</span>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(opt.amount, currency)}</span>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Promo Code */}
          {!showPayment && (
            <section className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">优惠码</h2>
              {appliedCodes.length > 0 && (
                <div className="mb-4 space-y-2">
                  {appliedCodes.map(code => (
                    <div key={code} className="flex items-center justify-between rounded bg-green-50 px-3 py-2 text-sm">
                      <span className="font-medium text-green-700">已应用: {code}</span>
                      <button onClick={() => handleRemovePromo(code)} className="text-red-500 hover:underline text-xs">移除</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={promoCode} onChange={e => { setPromoCode(e.target.value); setPromoError("") }}
                  placeholder="输入优惠码" className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm" />
                <button onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()}
                  className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50">
                  {promoLoading ? "应用中..." : "应用"}
                </button>
              </div>
              {promoError && <p className="mt-2 text-sm text-red-500">{promoError}</p>}
            </section>
          )}

          {/* Payment Section */}
          {showPayment ? (
            <section className="rounded-lg border border-[#635BFF] bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">支付信息</h2>
              <SimulatedStripeForm cart={cart} onSuccess={handlePaymentSuccess} onCancel={handlePaymentCancel} />
            </section>
          ) : canPay ? (
            <div>
              {paymentError && <p className="mb-4 text-sm text-red-500">{paymentError}</p>}
              <button onClick={handleProceedToPayment} disabled={paymentLoading}
                className="w-full rounded bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50">
                {paymentLoading ? "初始化支付..." : "去支付"}
              </button>
            </div>
          ) : null}

        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">订单摘要</h2>
            <div className="space-y-3 mb-4">
              {cart.items?.map(item => (
                <div key={item.id} className="flex gap-3">
                  {(item.thumbnail || item.variant?.product?.thumbnail) && (
                    <img src={item.thumbnail || item.variant?.product?.thumbnail || ""} alt={item.title}
                      className="h-16 w-16 rounded border border-border object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_title || item.variant?.product?.title || item.title}</p>
                    {item.variant_title && <p className="text-xs text-muted">{item.variant_title}</p>}
                    <p className="text-xs text-muted">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium whitespace-nowrap">{formatPrice(item.total, currency)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">小计</span><span>{formatPrice(cart.subtotal ?? cart.item_total, currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted">运费</span><span>{formatPrice(cart.shipping_total ?? 0, currency)}</span></div>
              {(cart.discount_total ?? 0) > 0 && (
                <div className="flex justify-between text-green-600"><span>折扣</span><span>-{formatPrice(cart.discount_total, currency)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted">税费</span><span>{formatPrice(cart.tax_total ?? 0, currency)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>合计</span><span>{formatPrice(cart.total, currency)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

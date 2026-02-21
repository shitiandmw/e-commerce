"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronDown,
  Lock,
  CreditCard,
  Truck,
  Shield,
  CheckCircle2,
} from "lucide-react"
import { useCart, getCartProductName, getCartProductImage } from "@/lib/cart-store"
import { cn } from "@/lib/utils"

/* ─── step definitions ─── */
type Step = "info" | "shipping" | "payment"
const steps: { key: Step; label: string; num: number }[] = [
  { key: "info", label: "聯絡資訊", num: 1 },
  { key: "shipping", label: "配送方式", num: 2 },
  { key: "payment", label: "付款", num: 3 },
]

/* ─── shared input ─── */
function FormInput({
  label,
  id,
  type = "text",
  placeholder,
  required = false,
  half = false,
}: {
  label: string
  id: string
  type?: string
  placeholder?: string
  required?: boolean
  half?: boolean
}) {
  return (
    <div className={half ? "flex-1 min-w-0" : ""}>
      <label htmlFor={id} className="block text-xs text-foreground/70 mb-1.5">
        {label}
        {required && <span className="text-gold ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full h-10 bg-background border border-border/50 rounded-sm px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/50 transition-colors"
      />
    </div>
  )
}

/* ─── step indicator ─── */
function StepIndicator({ current }: { current: Step }) {
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
                {s.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── shipping methods ─── */
const shippingMethods = [
  {
    id: "standard",
    label: "標準配送",
    desc: "7-14 個工作天",
    price: 120,
    priceLabel: "HK$120",
  },
  {
    id: "express",
    label: "特快配送",
    desc: "3-5 個工作天",
    price: 280,
    priceLabel: "HK$280",
  },
  {
    id: "free",
    label: "免費配送",
    desc: "10-18 個工作天（滿 HK$2,000）",
    price: 0,
    priceLabel: "免費",
    condition: 2000,
  },
]

/* ─── payment methods ─── */
const paymentMethods = [
  { id: "card", label: "信用卡 / 扣賬卡", icon: CreditCard },
  { id: "paypal", label: "PayPal", icon: Shield },
  { id: "bank", label: "銀行轉賬", icon: Lock },
]

/* ═══════════════ CHECKOUT PAGE ═══════════════ */
export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [step, setStep] = useState<Step>("info")
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [showOrderSummary, setShowOrderSummary] = useState(false)

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const selectedShipping = shippingMethods.find((m) => m.id === shippingMethod)
  const shippingCost =
    shippingMethod === "free" && subtotal >= 2000
      ? 0
      : selectedShipping?.price ?? 120
  const total = subtotal + shippingCost
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-xl font-serif text-foreground mb-4">購物車為空</h1>
        <p className="text-sm text-muted-foreground mb-6">
          請先加入商品到購物車再進行結帳。
        </p>
        <Link
          href="/category/cuban-cigars"
          className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-gold-light transition-colors"
        >
          探索雪茄
        </Link>
      </div>
    )
  }

  const handleSubmit = () => {
    if (step === "info") {
      setStep("shipping")
    } else if (step === "shipping") {
      setStep("payment")
    } else {
      clearCart()
      router.push("/checkout/success")
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
            返回購物車
          </Link>
          <Link href="/" className="text-lg font-serif font-bold tracking-[0.15em] text-gold">
            TIMECIGAR
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5 text-gold/60" />
            <span className="hidden sm:inline">安全結帳</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* left: form area */}
          <div className="flex-1 min-w-0">
            <StepIndicator current={step} />

            {/* ── step 1: info ── */}
            {step === "info" && (
              <div>
                <h2 className="text-lg font-serif text-foreground mb-6">聯絡資訊</h2>

                {/* contact */}
                <div className="mb-8">
                  <h3 className="text-xs text-gold uppercase tracking-widest mb-4">聯繫方式</h3>
                  <div className="flex flex-col gap-4">
                    <FormInput label="電郵地址" id="email" type="email" placeholder="your@email.com" required />
                    <FormInput label="電話號碼" id="phone" type="tel" placeholder="+852 xxxx xxxx" required />
                  </div>
                </div>

                {/* shipping address */}
                <div>
                  <h3 className="text-xs text-gold uppercase tracking-widest mb-4">送貨地址</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <FormInput label="名字" id="first-name" placeholder="名字" required half />
                      <FormInput label="姓氏" id="last-name" placeholder="姓氏" required half />
                    </div>
                    <FormInput label="地址" id="address1" placeholder="街道地址" required />
                    <FormInput label="地址（續）" id="address2" placeholder="公寓、樓層、單位（可選）" />
                    <div className="flex gap-4">
                      <FormInput label="城市" id="city" placeholder="城市" required half />
                      <FormInput label="郵政編碼" id="zip" placeholder="000000" half />
                    </div>
                    <div>
                      <label htmlFor="country" className="block text-xs text-foreground/70 mb-1.5">
                        國家 / 地區<span className="text-gold ml-0.5">*</span>
                      </label>
                      <select
                        id="country"
                        className="w-full h-10 bg-background border border-border/50 rounded-sm px-3 text-sm text-foreground focus:outline-none focus:border-gold/50 transition-colors appearance-none"
                        defaultValue="HK"
                      >
                        <option value="HK">香港</option>
                        <option value="MO">澳門</option>
                        <option value="TW">台灣</option>
                        <option value="SG">新加坡</option>
                        <option value="MY">馬來西亞</option>
                        <option value="CN">中國大陸</option>
                        <option value="JP">日本</option>
                        <option value="US">美國</option>
                        <option value="UK">英國</option>
                        <option value="OTHER">其他</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── step 2: shipping ── */}
            {step === "shipping" && (
              <div>
                <h2 className="text-lg font-serif text-foreground mb-6">配送方式</h2>
                <div className="flex flex-col gap-3">
                  {shippingMethods.map((m) => {
                    const isDisabled = m.condition !== undefined && subtotal < m.condition
                    return (
                      <button
                        key={m.id}
                        onClick={() => !isDisabled && setShippingMethod(m.id)}
                        disabled={isDisabled}
                        className={cn(
                          "flex items-center justify-between p-4 border transition-colors text-left",
                          shippingMethod === m.id
                            ? "border-gold/50 bg-gold/5"
                            : isDisabled
                              ? "border-border/20 opacity-40 cursor-not-allowed"
                              : "border-border/30 hover:border-gold/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "size-4 rounded-full border-2 flex items-center justify-center",
                              shippingMethod === m.id ? "border-gold" : "border-border/50"
                            )}
                          >
                            {shippingMethod === m.id && <div className="size-2 rounded-full bg-gold" />}
                          </div>
                          <div>
                            <p className="text-sm text-foreground">{m.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
                          </div>
                        </div>
                        <span className={cn("text-sm font-medium", m.price === 0 ? "text-gold" : "text-foreground")}>
                          {m.priceLabel}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-8 p-4 bg-secondary/30 border border-border/20 flex items-start gap-3">
                  <Truck className="size-4 text-gold/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-foreground/70">所有訂單均以專業雪茄包裝發貨</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      我們使用專業恆溫恆濕包裝，確保雪茄在運輸過程中保持最佳狀態。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── step 3: payment ── */}
            {step === "payment" && (
              <div>
                <h2 className="text-lg font-serif text-foreground mb-6">付款方式</h2>

                {/* method selector */}
                <div className="flex flex-col gap-3 mb-8">
                  {paymentMethods.map((m) => {
                    const Icon = m.icon
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={cn(
                          "flex items-center gap-3 p-4 border transition-colors text-left",
                          paymentMethod === m.id
                            ? "border-gold/50 bg-gold/5"
                            : "border-border/30 hover:border-gold/30"
                        )}
                      >
                        <div
                          className={cn(
                            "size-4 rounded-full border-2 flex items-center justify-center",
                            paymentMethod === m.id ? "border-gold" : "border-border/50"
                          )}
                        >
                          {paymentMethod === m.id && <div className="size-2 rounded-full bg-gold" />}
                        </div>
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{m.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* card form */}
                {paymentMethod === "card" && (
                  <div className="border border-border/30 p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <CreditCard className="size-4 text-gold/60" />
                      <span className="text-xs text-foreground/70">信用卡詳細資料</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      <FormInput label="持卡人姓名" id="card-name" placeholder="卡上姓名" required />
                      <FormInput label="卡號" id="card-number" placeholder="xxxx xxxx xxxx xxxx" required />
                      <div className="flex gap-4">
                        <FormInput label="有效期" id="card-expiry" placeholder="MM / YY" required half />
                        <FormInput label="安全碼" id="card-cvc" placeholder="CVC" required half />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "paypal" && (
                  <div className="border border-border/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      點擊「確認付款」後，您將被重定向至 PayPal 完成付款。
                    </p>
                  </div>
                )}

                {paymentMethod === "bank" && (
                  <div className="border border-border/30 p-5">
                    <p className="text-xs text-muted-foreground mb-3">請轉賬至以下銀行帳戶：</p>
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-border/20">
                        <span className="text-muted-foreground">銀行</span>
                        <span className="text-foreground">HSBC</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/20">
                        <span className="text-muted-foreground">帳戶名稱</span>
                        <span className="text-foreground">TimeCigar Limited</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">帳戶號碼</span>
                        <span className="text-foreground font-mono">xxx-xxxxxx-xxx</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* terms */}
                <label className="flex items-start gap-3 mt-6 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-[#c8a96e]" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    我已閱讀並同意 TimeCigar 的
                    <Link href="/terms" className="text-gold hover:underline mx-0.5">服務條款</Link>
                    和
                    <Link href="/privacy" className="text-gold hover:underline mx-0.5">私隱政策</Link>
                    。
                  </span>
                </label>
              </div>
            )}

            {/* navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/20">
              {step !== "info" ? (
                <button
                  onClick={() => setStep(step === "payment" ? "shipping" : "info")}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  <ChevronLeft className="size-4" />
                  上一步
                </button>
              ) : (
                <Link
                  href="/cart"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  <ChevronLeft className="size-4" />
                  返回購物車
                </Link>
              )}

              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-gold text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors"
              >
                {step === "payment" ? (
                  <>
                    <Lock className="size-3.5" />
                    確認付款 HK${total.toLocaleString()}
                  </>
                ) : (
                  "繼續"
                )}
              </button>
            </div>
          </div>

          {/* right: order summary sidebar */}
          <div className="lg:w-[360px] shrink-0">
            {/* mobile toggle */}
            <button
              onClick={() => setShowOrderSummary(!showOrderSummary)}
              className="lg:hidden flex items-center justify-between w-full p-4 bg-card border border-border/30 mb-4"
            >
              <span className="text-sm text-foreground">訂單摘要 ({itemCount})</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gold">HK${total.toLocaleString()}</span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showOrderSummary && "rotate-180")} />
              </div>
            </button>

            <div className={cn("lg:block", showOrderSummary ? "block" : "hidden")}>
              <div className="sticky top-20 bg-card border border-border/30 p-5">
                <h3 className="text-sm font-medium text-foreground mb-4 tracking-wide">訂單內容</h3>

                {/* items */}
                <div className="flex flex-col gap-4 max-h-[320px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="relative size-14 bg-secondary/30 shrink-0">
                        <Image
                          src={getCartProductImage(item.product)}
                          alt={getCartProductName(item.product)}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute -top-1.5 -right-1.5 size-5 flex items-center justify-center bg-gold text-[9px] font-bold text-primary-foreground rounded-full">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground line-clamp-1">{getCartProductName(item.product)}</p>
                        {item.product.brandEn && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.product.brandEn}</p>
                        )}
                        <p className="text-xs text-gold mt-1">
                          HK${(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* totals */}
                <div className="border-t border-border/30 mt-4 pt-4 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">小計</span>
                    <span className="text-foreground">HK${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">運費</span>
                    <span className={shippingCost === 0 ? "text-gold" : "text-foreground"}>
                      {shippingCost === 0 ? "免費" : `HK$${shippingCost.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border/30 mt-3 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-foreground">總計</span>
                    <span className="text-lg font-bold text-gold">HK${total.toLocaleString()}</span>
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

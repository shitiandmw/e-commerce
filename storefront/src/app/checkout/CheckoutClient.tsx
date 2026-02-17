"use client"

import { useCart } from "@/components/CartProvider"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface FormData {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  province: string
  postalCode: string
}

interface FormErrors {
  [key: string]: string
}

function formatPrice(amount: number, currency: string) {
  return `${currency.toUpperCase()} ${amount}`
}

export default function CheckoutClient() {
  const { cart, loading, itemCount } = useCart()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const items = cart?.items ?? []
  const currency = cart?.currency_code || "eur"

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!formData.email.trim()) newErrors.email = "请输入邮箱"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "邮箱格式不正确"
    if (!formData.firstName.trim()) newErrors.firstName = "请输入名字"
    if (!formData.lastName.trim()) newErrors.lastName = "请输入姓氏"
    if (!formData.phone.trim()) newErrors.phone = "请输入手机号"
    if (!formData.address.trim()) newErrors.address = "请输入详细地址"
    if (!formData.city.trim()) newErrors.city = "请输入城市"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 1500))
    router.push("/checkout/result?status=success")
  }

  if (!cart && !loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-muted">购物车为空</p>
        <Link href="/products" className="mt-4 inline-flex min-h-[44px] items-center rounded-md bg-gold px-6 py-3 text-sm font-semibold text-background">
          去购物
        </Link>
      </div>
    )
  }

  if (loading && items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="h-8 w-32 animate-pulse rounded bg-surface-light" />
        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            {[1, 2, 3].map((i) => (<div key={i} className="h-16 animate-pulse rounded-lg bg-surface" />))}
          </div>
          <div className="h-64 animate-pulse rounded-lg bg-surface lg:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <h1 className="mb-8 text-xl font-bold text-foreground md:text-2xl">结算</h1>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: Form */}
          <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-3">
            {/* Contact */}
            <fieldset className="rounded-lg border border-border bg-surface p-4 md:p-6">
              <legend className="px-2 text-sm font-semibold text-gold">联系信息</legend>
              <div className="space-y-4">
                <FormField label="邮箱" error={errors.email} required>
                  <input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    placeholder="your@email.com" />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="姓氏" error={errors.lastName} required>
                    <input type="text" value={formData.lastName} onChange={(e) => handleChange("lastName", e.target.value)}
                      className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                      placeholder="张" />
                  </FormField>
                  <FormField label="名字" error={errors.firstName} required>
                    <input type="text" value={formData.firstName} onChange={(e) => handleChange("firstName", e.target.value)}
                      className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                      placeholder="三" />
                  </FormField>
                </div>
                <FormField label="手机号" error={errors.phone} required>
                  <input type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    placeholder="13800138000" />
                </FormField>
              </div>
            </fieldset>

            {/* Shipping */}
            <fieldset className="rounded-lg border border-border bg-surface p-4 md:p-6">
              <legend className="px-2 text-sm font-semibold text-gold">收货地址</legend>
              <div className="space-y-4">
                <FormField label="详细地址" error={errors.address} required>
                  <input type="text" value={formData.address} onChange={(e) => handleChange("address", e.target.value)}
                    className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    placeholder="街道、门牌号" />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="城市" error={errors.city} required>
                    <input type="text" value={formData.city} onChange={(e) => handleChange("city", e.target.value)}
                      className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                      placeholder="北京" />
                  </FormField>
                  <FormField label="省份">
                    <input type="text" value={formData.province} onChange={(e) => handleChange("province", e.target.value)}
                      className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                      placeholder="北京市" />
                  </FormField>
                  <FormField label="邮编">
                    <input type="text" value={formData.postalCode} onChange={(e) => handleChange("postalCode", e.target.value)}
                      className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                      placeholder="100000" />
                  </FormField>
                </div>
              </div>
            </fieldset>

            {/* Payment placeholder */}
            <fieldset className="rounded-lg border border-border bg-surface p-4 md:p-6">
              <legend className="px-2 text-sm font-semibold text-gold">支付方式</legend>
              <div className="flex items-center gap-3 rounded-md border border-gold/30 bg-gold/5 p-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gold">
                  <div className="h-2.5 w-2.5 rounded-full bg-gold" />
                </div>
                <span className="text-sm text-foreground">模拟支付（测试环境）</span>
              </div>
            </fieldset>

            {/* Submit - mobile only */}
            <button type="submit" disabled={submitting || items.length === 0}
              className="w-full min-h-[48px] rounded-md bg-gold py-3 text-center text-sm font-bold text-background transition-colors hover:bg-gold-light disabled:opacity-50 lg:hidden">
              {submitting ? "处理中..." : `确认支付 ${cart?.total != null ? formatPrice(cart.total, currency) : ""}`}
            </button>
          </form>

          {/* Right: Order Summary */}
          <aside className="lg:col-span-2">
            <div className="sticky top-20 rounded-lg border border-border bg-surface p-4 md:p-6">
              <h2 className="mb-4 text-sm font-semibold text-foreground">订单摘要 ({itemCount})</h2>
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {items.map((item) => {
                  const thumb = item.thumbnail || item.variant?.product?.thumbnail || null
                  const title = item.product_title || item.variant?.product?.title || item.title
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-surface-light">
                        {thumb ? (
                          <Image src={thumb} alt={title} fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted">N/A</div>
                        )}
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-background">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-foreground">{title}</p>
                        <p className="text-xs text-gold">{formatPrice(item.total, currency)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                {cart?.subtotal != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">小计</span>
                    <span className="text-foreground">{formatPrice(cart.subtotal, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted">运费</span>
                  <span className="text-foreground">{formatPrice(cart?.shipping_total ?? 0, currency)}</span>
                </div>
                {(cart?.discount_total ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">折扣</span>
                    <span className="text-green-400">-{formatPrice(cart!.discount_total!, currency)}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between border-t border-border pt-4">
                <span className="text-base font-semibold text-foreground">总计</span>
                <span className="text-base font-bold text-gold">{formatPrice(cart?.total ?? 0, currency)}</span>
              </div>
              {/* Submit - desktop only */}
              <button type="submit" form="" disabled={submitting || items.length === 0}
                onClick={handleSubmit as any}
                className="mt-4 hidden w-full min-h-[48px] rounded-md bg-gold py-3 text-center text-sm font-bold text-background transition-colors hover:bg-gold-light disabled:opacity-50 lg:block">
                {submitting ? "处理中..." : "确认支付"}
              </button>
              <Link href="/cart" className="mt-3 block text-center text-xs text-muted hover:text-gold">
                ← 返回购物车
              </Link>
            </div>
          </aside>
        </div>
      </div>
  )
}

function FormField({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted">
        {label}{required && <span className="text-error"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useCustomer, useCustomerOrders } from "@/hooks/use-customers"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  ArrowLeft,
  Pencil,
  User,
  ShoppingCart,
  MapPin,
  Mail,
  Phone,
  Building2,
  Calendar,
  Hash,
  Package,
} from "lucide-react"

type Tab = "info" | "orders" | "addresses"

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations("customers")
  const customerId = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>("info")

  const { data: customer, isLoading, error } = useCustomer(customerId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/customers")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("detail.backToCustomers")}
        </button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-destructive">{t("detail.customerNotFound")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("detail.customerNotFoundDescription")}
          </p>
        </div>
      </div>
    )
  }

  const fullName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : customer.email[0].toUpperCase()

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: "info", label: t("detail.tabs.information"), icon: User },
    { key: "orders", label: t("detail.tabs.orders"), icon: ShoppingCart },
    { key: "addresses", label: t("detail.tabs.addresses"), icon: MapPin },
  ]

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/customers")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("detail.backToCustomers")}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {fullName || customer.email}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-muted-foreground">
                {customer.email}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  customer.has_account
                    ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                    : "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10"
                )}
              >
                {customer.has_account ? t("accountStatus.registered") : t("accountStatus.guest")}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/customers/${customerId}/edit`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Pencil className="h-4 w-4" />
          {t("detail.editCustomer")}
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "info" && <CustomerInfoTab customer={customer} t={t} />}
        {activeTab === "orders" && <CustomerOrdersTab customerId={customerId} t={t} />}
        {activeTab === "addresses" && (
          <CustomerAddressesTab customer={customer} t={t} />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Info Tab                                                          */
/* ------------------------------------------------------------------ */

type TranslationFn = ReturnType<typeof useTranslations<"customers">>

function CustomerInfoTab({
  customer,
  t,
}: {
  customer: NonNullable<ReturnType<typeof useCustomer>["data"]>
  t: TranslationFn
}) {
  const infoFields = [
    {
      icon: User,
      label: t("detail.info.firstName"),
      value: customer.first_name,
    },
    {
      icon: User,
      label: t("detail.info.lastName"),
      value: customer.last_name,
    },
    {
      icon: Mail,
      label: t("detail.info.email"),
      value: customer.email,
    },
    {
      icon: Phone,
      label: t("detail.info.phone"),
      value: customer.phone,
    },
    {
      icon: Building2,
      label: t("detail.info.company"),
      value: customer.company_name,
    },
    {
      icon: Calendar,
      label: t("detail.info.registered"),
      value: format(new Date(customer.created_at), "PPP 'at' p"),
    },
    {
      icon: Calendar,
      label: t("detail.info.lastUpdated"),
      value: format(new Date(customer.updated_at), "PPP 'at' p"),
    },
  ]

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="px-6 py-4 border-b">
        <h2 className="text-base font-semibold">{t("detail.info.basicInformation")}</h2>
      </div>
      <div className="divide-y">
        {infoFields.map((field) => (
          <div key={field.label} className="flex items-center gap-4 px-6 py-4">
            <field.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-muted-foreground w-36 shrink-0">
              {field.label}
            </span>
            <span className="text-sm">{field.value || "—"}</span>
          </div>
        ))}
      </div>

      {/* Metadata */}
      {customer.metadata && Object.keys(customer.metadata).length > 0 && (
        <>
          <div className="px-6 py-4 border-t border-b">
            <h2 className="text-base font-semibold">{t("detail.info.metadata")}</h2>
          </div>
          <div className="divide-y">
            {Object.entries(customer.metadata).map(([key, value]) => (
              <div key={key} className="flex items-center gap-4 px-6 py-4">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-muted-foreground w-36 shrink-0">
                  {key}
                </span>
                <span className="text-sm font-mono text-xs">
                  {JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Orders Tab                                                        */
/* ------------------------------------------------------------------ */

function CustomerOrdersTab({ customerId, t }: { customerId: string; t: TranslationFn }) {
  const { data, isLoading, error } = useCustomerOrders(customerId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
        <p className="text-sm text-destructive">{t("detail.orders.failedToLoad")}</p>
      </div>
    )
  }

  const orders = data?.orders || []

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {t("detail.orders.noOrders")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="px-6 py-4 border-b">
        <h2 className="text-base font-semibold">
          {t("detail.orders.orderHistory", { count: data?.count ?? orders.length })}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("detail.orders.order")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("detail.orders.status")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("detail.orders.items")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("detail.orders.total")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("detail.orders.date")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      #{order.display_id}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {(order.items?.length ?? 0) === 1
                    ? t("detail.orders.itemCount", { count: 1 })
                    : t("detail.orders.itemsCount", { count: order.items?.length ?? 0 })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  {formatCurrency(order.total, order.currency_code)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {format(new Date(order.created_at), "MMM d, yyyy")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed:
      "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
    pending:
      "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20",
    canceled: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
    archived: "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10",
    requires_action:
      "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[status] ||
          "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}

function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode?.toUpperCase() || "USD",
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${currencyCode?.toUpperCase() || "USD"}`
  }
}

/* ------------------------------------------------------------------ */
/*  Addresses Tab                                                     */
/* ------------------------------------------------------------------ */

function CustomerAddressesTab({
  customer,
  t,
}: {
  customer: NonNullable<ReturnType<typeof useCustomer>["data"]>
  t: TranslationFn
}) {
  const addresses = customer.addresses || []

  if (addresses.length === 0) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {t("detail.addresses.noAddresses")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {addresses.map((address) => {
        const lines = [
          address.address_1,
          address.address_2,
          [address.city, address.province, address.postal_code]
            .filter(Boolean)
            .join(", "),
          address.country_code?.toUpperCase(),
        ].filter(Boolean)

        const name = [address.first_name, address.last_name]
          .filter(Boolean)
          .join(" ")

        return (
          <div
            key={address.id}
            className="rounded-lg border bg-card p-5 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {name || t("detail.addresses.address")}
                </span>
              </div>
              <div className="flex gap-1.5">
                {address.is_default_shipping && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {t("detail.addresses.defaultShipping")}
                  </span>
                )}
                {address.is_default_billing && (
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                    {t("detail.addresses.defaultBilling")}
                  </span>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-0.5">
              {lines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {(address.company || address.phone) && (
              <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground border-t">
                {address.company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {address.company}
                  </span>
                )}
                {address.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {address.phone}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

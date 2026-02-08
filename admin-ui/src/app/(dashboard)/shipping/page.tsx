"use client"

import { useTranslations } from "next-intl"
import { ShippingOptionsTable } from "@/components/shipping/shipping-options-table"
import { ShippingProfiles } from "@/components/shipping/shipping-profiles"
import { FulfillmentProviders } from "@/components/shipping/fulfillment-providers"

export default function ShippingPage() {
  const t = useTranslations("shipping")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <ShippingOptionsTable />
      <ShippingProfiles />
      <FulfillmentProviders />
    </div>
  )
}

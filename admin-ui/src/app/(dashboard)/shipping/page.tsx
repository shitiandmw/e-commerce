"use client"

import { ShippingOptionsTable } from "@/components/shipping/shipping-options-table"
import { ShippingProfiles } from "@/components/shipping/shipping-profiles"
import { FulfillmentProviders } from "@/components/shipping/fulfillment-providers"

export default function ShippingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shipping</h1>
        <p className="text-muted-foreground">
          Manage shipping options, profiles, and fulfillment providers
        </p>
      </div>

      <ShippingOptionsTable />
      <ShippingProfiles />
      <FulfillmentProviders />
    </div>
  )
}

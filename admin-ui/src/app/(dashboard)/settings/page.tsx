"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { StoreSettings } from "@/components/settings/store-settings"
import { RegionSettings } from "@/components/settings/region-settings"
import { SalesChannelSettings } from "@/components/settings/sales-channel-settings"
import { ShippingSettings } from "@/components/settings/shipping-settings"
import { PaymentSettings } from "@/components/settings/payment-settings"
import { UserSettings } from "@/components/settings/user-settings"
import { ApiKeySettings } from "@/components/settings/api-key-settings"
import {
  Store,
  Globe,
  ShoppingBag,
  Truck,
  CreditCard,
  Users,
  Key,
} from "lucide-react"

const tabs = [
  { id: "store", label: "Store", icon: Store },
  { id: "regions", label: "Regions", icon: Globe },
  { id: "channels", label: "Sales Channels", icon: ShoppingBag },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "api-keys", label: "API Keys", icon: Key },
] as const

type TabId = (typeof tabs)[number]["id"]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>("store")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your store configuration, regions, payments, and team.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation */}
        <nav className="flex lg:w-56 lg:flex-col lg:shrink-0">
          <div className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-0.5 lg:pb-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "store" && <StoreSettings />}
          {activeTab === "regions" && <RegionSettings />}
          {activeTab === "channels" && <SalesChannelSettings />}
          {activeTab === "shipping" && <ShippingSettings />}
          {activeTab === "payments" && <PaymentSettings />}
          {activeTab === "team" && <UserSettings />}
          {activeTab === "api-keys" && <ApiKeySettings />}
        </div>
      </div>
    </div>
  )
}

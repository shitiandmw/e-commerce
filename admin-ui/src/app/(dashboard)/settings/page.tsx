"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { StoreSettings } from "@/components/settings/store-settings"
import { RegionSettings } from "@/components/settings/region-settings"
import { SalesChannelSettings } from "@/components/settings/sales-channel-settings"
import { ShippingSettings } from "@/components/settings/shipping-settings"
import { PaymentSettings } from "@/components/settings/payment-settings"
import { UserSettings } from "@/components/settings/user-settings"
import { ApiKeySettings } from "@/components/settings/api-key-settings"
import { TranslationSettings } from "@/components/settings/translation-settings"
import {
  Store,
  Globe,
  ShoppingBag,
  Truck,
  CreditCard,
  Users,
  Key,
  Languages,
} from "lucide-react"

const tabIds = ["store", "regions", "channels", "shipping", "payments", "team", "api-keys", "translations"] as const
type TabId = (typeof tabIds)[number]

const tabIcons: Record<TabId, typeof Store> = {
  store: Store,
  regions: Globe,
  channels: ShoppingBag,
  shipping: Truck,
  payments: CreditCard,
  team: Users,
  "api-keys": Key,
  translations: Languages,
}

const tabLabelKeys: Record<TabId, string> = {
  store: "tabs.store",
  regions: "tabs.regions",
  channels: "tabs.channels",
  shipping: "tabs.shipping",
  payments: "tabs.payments",
  team: "tabs.team",
  "api-keys": "tabs.apiKeys",
  translations: "tabs.translations",
}

export default function SettingsPage() {
  const t = useTranslations("settings")
  const [activeTab, setActiveTab] = React.useState<TabId>("store")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation */}
        <nav className="flex lg:w-56 lg:flex-col lg:shrink-0">
          <div className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-0.5 lg:pb-0">
            {tabIds.map((tabId) => {
              const isActive = activeTab === tabId
              const Icon = tabIcons[tabId]
              return (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(tabLabelKeys[tabId])}
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
          {activeTab === "translations" && <TranslationSettings />}
        </div>
      </div>
    </div>
  )
}

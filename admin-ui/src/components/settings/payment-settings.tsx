"use client"

import { usePaymentProviders } from "@/hooks/use-settings"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CreditCard } from "lucide-react"

export function PaymentSettings() {
  const { data, isLoading } = usePaymentProviders()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const providers = data?.payment_providers || []

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Payment Providers</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          View configured payment providers. Payment providers handle payment processing for your store.
        </p>

        {providers.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No payment providers configured. Add payment provider modules in your Medusa configuration.
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between rounded-md border p-4"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{provider.id}</span>
                    <p className="text-xs text-muted-foreground">
                      Payment Provider
                    </p>
                  </div>
                </div>
                <Badge variant={provider.is_enabled !== false ? "success" : "secondary"}>
                  {provider.is_enabled !== false ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useTranslations } from "next-intl"
import { OrderTable } from "@/components/orders/order-table"

export default function OrdersPage() {
  const t = useTranslations("orders")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <OrderTable />
    </div>
  )
}

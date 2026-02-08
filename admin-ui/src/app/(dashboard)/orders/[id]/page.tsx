"use client"

import { useParams } from "next/navigation"
import { OrderDetail } from "@/components/orders/order-detail"

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string

  return <OrderDetail orderId={orderId} />
}

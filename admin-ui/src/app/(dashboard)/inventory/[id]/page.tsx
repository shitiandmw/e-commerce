"use client"

import { useParams } from "next/navigation"
import { InventoryDetail } from "@/components/inventory/inventory-detail"

export default function InventoryDetailPage() {
  const params = useParams()
  const inventoryItemId = params.id as string

  return <InventoryDetail inventoryItemId={inventoryItemId} />
}

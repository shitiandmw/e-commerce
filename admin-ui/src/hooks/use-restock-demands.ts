"use client"

import { useQuery } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

export type RestockDemandStatus = "pending" | "restocked"

export interface RestockDemandUser {
  customer_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  requested_at: string
}
export interface RestockDemand {
  id: string
  variant_id: string
  product_id: string
  product_title: string
  variant_title: string | null
  sku: string | null
  specification: Array<{ name: string; value: string }>
  status: RestockDemandStatus
  requester_count: number
  logged_user_count: number
  anonymous_count: number
  last_requested_at: string
  restocked_at: string | null
  created_at: string
  logged_users: RestockDemandUser[]
}

type RestockDemandsResponse = {
  restock_demands: RestockDemand[]
  count: number
  offset: number
  limit: number
}

export function useRestockDemands(
  status: RestockDemandStatus,
  offset = 0,
  limit = 20
) {
  return useQuery<RestockDemandsResponse>({
    queryKey: ["restock-demands", { status, offset, limit }],
    queryFn: () => adminFetch("/admin/restock-demands", {
      params: {
        status,
        offset: String(offset),
        limit: String(limit),
      },
    }),
  })
}

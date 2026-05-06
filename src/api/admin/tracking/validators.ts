import { z } from "zod"

export const PostAdminCreateTrackingRecord = z.object({
  fulfillment_id: z.string().min(1),
  tracking_number: z.string().min(1),
  carrier: z.string().min(1),
  carrier_name: z.string().min(1),
  tracking_url: z.string().url().optional(),
})

export type PostAdminCreateTrackingRecordType = z.infer<typeof PostAdminCreateTrackingRecord>

export const PostAdminUpdateTrackingStatus = z.object({
  status: z.enum(["pending", "in_transit", "out_for_delivery", "delivered", "exception", "expired"]).optional(),
  events: z.array(z.object({
    status: z.string().min(1),
    description: z.string().min(1),
    location: z.string().optional(),
    occurred_at: z.string().min(1),
  })).optional(),
})

export type PostAdminUpdateTrackingStatusType = z.infer<typeof PostAdminUpdateTrackingStatus>

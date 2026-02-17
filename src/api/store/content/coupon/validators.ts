import { z } from "zod"
import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework"

export const ClaimCouponSchema = z.object({
  popup_id: z.string(),
  email: z.string().email(),
})

export type ClaimCouponSchema = z.infer<typeof ClaimCouponSchema>

export const couponMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/content/coupon",
    method: "POST",
    middlewares: [validateAndTransformBody(ClaimCouponSchema)],
  },
]

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { claimCouponWorkflow } from "../../../../workflows/popup/claim-coupon"
import { ClaimCouponSchema } from "./validators"

export const POST = async (
  req: MedusaRequest<ClaimCouponSchema>,
  res: MedusaResponse
) => {
  const { popup_id, email } = req.validatedBody

  const { result } = await claimCouponWorkflow(req.scope).run({
    input: { popup_id, email },
  })

  res.json({
    success: true,
    coupon_code: result.coupon_code,
  })
}

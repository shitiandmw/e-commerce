import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { POPUP_MODULE } from "../../modules/popup"
import PopupModuleService from "../../modules/popup/service"
import { MedusaError } from "@medusajs/framework/utils"
import {
  getClaimablePromotionCodes,
  normalizePromotionCode,
} from "../../lib/promotion-availability"

type ClaimCouponInput = {
  popup_id: string
  email: string
}

const claimCouponStep = createStep(
  "claim-coupon-step",
  async (input: ClaimCouponInput, { container }) => {
    const popupService: PopupModuleService = container.resolve(POPUP_MODULE)
    const popup = await popupService.retrievePopup(input.popup_id)

    if (!popup || popup.popup_type !== "coupon" || !popup.coupon_code) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Coupon popup not found or invalid"
      )
    }

    if (!popup.is_enabled) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This coupon is no longer available"
      )
    }

    const couponCode = normalizePromotionCode(popup.coupon_code)
    const claimableCodes = await getClaimablePromotionCodes(container, [couponCode])

    if (!claimableCodes.has(couponCode)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This coupon is no longer available"
      )
    }

    const logger = container.resolve("logger")
    logger.info(`[coupon-claim] email=${input.email}, popup=${input.popup_id}, code=${couponCode}`)

    return new StepResponse({
      coupon_code: couponCode,
      email: input.email,
    })
  }
)

export const claimCouponWorkflow = createWorkflow(
  "claim-coupon",
  function (input: ClaimCouponInput) {
    const result = claimCouponStep(input)
    return new WorkflowResponse(result)
  }
)

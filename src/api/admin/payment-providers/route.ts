import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const paymentModule = req.scope.resolve(Modules.PAYMENT)

  const payment_providers = await paymentModule.listPaymentProviders(
    {},
    { take: 50 }
  )

  res.json({
    payment_providers,
    count: payment_providers.length,
  })
}

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CARRIERS } from "../../../../modules/tracking/carriers"

export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  res.json({ carriers: CARRIERS })
}

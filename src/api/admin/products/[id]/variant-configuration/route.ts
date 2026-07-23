import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { syncProductVariantConfigurationWorkflow } from "../../../../../workflows/product/sync-variant-configuration"
import type { PostAdminProductVariantConfigurationType } from "./validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<PostAdminProductVariantConfigurationType>,
  res: MedusaResponse
) => {
  const { result } = await syncProductVariantConfigurationWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      actor_id: req.auth_context?.actor_id,
      ...req.validatedBody,
    },
  })

  res.status(200).json(result)
}

import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createAttributeTemplateWorkflow } from "../../../workflows/attribute-template/create-attribute-template"
import { PostAdminCreateAttributeTemplateType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: attribute_templates, metadata } = await query.graph({
    entity: "attribute_template",
    ...req.queryConfig,
  })

  res.json({
    attribute_templates,
    count: metadata?.count || attribute_templates.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || attribute_templates.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateAttributeTemplateType>,
  res: MedusaResponse
) => {
  const { result } = await createAttributeTemplateWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ attribute_template: result })
}

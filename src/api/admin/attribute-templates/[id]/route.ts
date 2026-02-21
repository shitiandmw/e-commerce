import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateAttributeTemplateWorkflow } from "../../../../workflows/attribute-template/update-attribute-template"
import { deleteAttributeTemplateWorkflow } from "../../../../workflows/attribute-template/delete-attribute-template"
import { PostAdminUpdateAttributeTemplateType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [attribute_template] } = await query.graph({
    entity: "attribute_template",
    fields: ["*"],
    filters: { id },
  })

  if (!attribute_template) {
    res.status(404).json({ message: "Attribute template not found" })
    return
  }

  res.json({ attribute_template })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateAttributeTemplateType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateAttributeTemplateWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ attribute_template: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteAttributeTemplateWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "attribute_template", deleted: true })
}

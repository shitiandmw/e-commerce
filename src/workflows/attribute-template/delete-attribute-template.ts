import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ATTRIBUTE_TEMPLATE_MODULE } from "../../modules/attribute-template"
import AttributeTemplateModuleService from "../../modules/attribute-template/service"

type DeleteAttributeTemplateInput = {
  id: string
}

const deleteAttributeTemplateStep = createStep(
  "delete-attribute-template-step",
  async ({ id }: DeleteAttributeTemplateInput, { container }) => {
    const service: AttributeTemplateModuleService = container.resolve(ATTRIBUTE_TEMPLATE_MODULE)
    const template = await service.retrieveAttributeTemplate(id)
    await service.deleteAttributeTemplates(id)
    return new StepResponse(id, template)
  },
  async (template: Record<string, unknown>, { container }) => {
    const service: AttributeTemplateModuleService = container.resolve(ATTRIBUTE_TEMPLATE_MODULE)
    await service.createAttributeTemplates(template as any)
  }
)

export const deleteAttributeTemplateWorkflow = createWorkflow(
  "delete-attribute-template",
  (input: DeleteAttributeTemplateInput) => {
    const id = deleteAttributeTemplateStep(input)
    return new WorkflowResponse(id)
  }
)

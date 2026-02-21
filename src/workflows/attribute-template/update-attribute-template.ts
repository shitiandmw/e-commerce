import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ATTRIBUTE_TEMPLATE_MODULE } from "../../modules/attribute-template"
import AttributeTemplateModuleService from "../../modules/attribute-template/service"

type UpdateAttributeTemplateInput = {
  id: string
  name?: string
  attributes?: string[]
}

const updateAttributeTemplateStep = createStep(
  "update-attribute-template-step",
  async (input: UpdateAttributeTemplateInput, { container }) => {
    const service: AttributeTemplateModuleService = container.resolve(ATTRIBUTE_TEMPLATE_MODULE)
    const existing = await service.retrieveAttributeTemplate(input.id)
    const template = await service.updateAttributeTemplates(input)
    return new StepResponse(template, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const service: AttributeTemplateModuleService = container.resolve(ATTRIBUTE_TEMPLATE_MODULE)
    await service.updateAttributeTemplates(previous as any)
  }
)

export const updateAttributeTemplateWorkflow = createWorkflow(
  "update-attribute-template",
  (input: UpdateAttributeTemplateInput) => {
    const template = updateAttributeTemplateStep(input)
    return new WorkflowResponse(template)
  }
)

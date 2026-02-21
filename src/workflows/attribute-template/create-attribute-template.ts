import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ATTRIBUTE_TEMPLATE_MODULE } from "../../modules/attribute-template"
import AttributeTemplateModuleService from "../../modules/attribute-template/service"

type CreateAttributeTemplateInput = {
  name: string
  attributes: string[]
}

const createAttributeTemplateStep = createStep(
  "create-attribute-template-step",
  async (input: CreateAttributeTemplateInput, { container }) => {
    const service: AttributeTemplateModuleService = container.resolve(ATTRIBUTE_TEMPLATE_MODULE)
    const template = await service.createAttributeTemplates(input)
    return new StepResponse(template, template.id)
  },
  async (templateId: string, { container }) => {
    const service: AttributeTemplateModuleService = container.resolve(ATTRIBUTE_TEMPLATE_MODULE)
    await service.deleteAttributeTemplates(templateId)
  }
)

export const createAttributeTemplateWorkflow = createWorkflow(
  "create-attribute-template",
  (input: CreateAttributeTemplateInput) => {
    const template = createAttributeTemplateStep(input)
    return new WorkflowResponse(template)
  }
)

import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ARTICLE_MODULE } from "../../modules/article"
import ArticleModuleService from "../../modules/article/service"

type UpdateArticleCategoryInput = {
  id: string
  name?: string
  handle?: string
  description?: string | null
  sort_order?: number
}

const updateArticleCategoryStep = createStep(
  "update-article-category-step",
  async (input: UpdateArticleCategoryInput, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    const existing = await articleService.retrieveArticleCategory(input.id)
    const category = await articleService.updateArticleCategories(input)
    return new StepResponse(category, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    await articleService.updateArticleCategories(previous as any)
  }
)

export const updateArticleCategoryWorkflow = createWorkflow(
  "update-article-category",
  (input: UpdateArticleCategoryInput) => {
    const category = updateArticleCategoryStep(input)
    return new WorkflowResponse(category)
  }
)

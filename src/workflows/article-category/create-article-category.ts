import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ARTICLE_MODULE } from "../../modules/article"
import ArticleModuleService from "../../modules/article/service"

type CreateArticleCategoryInput = {
  name: string
  handle: string
  description?: string
  sort_order?: number
}

const createArticleCategoryStep = createStep(
  "create-article-category-step",
  async (input: CreateArticleCategoryInput, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    const category = await articleService.createArticleCategories(input)
    return new StepResponse(category, category.id)
  },
  async (categoryId: string, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    await articleService.deleteArticleCategories(categoryId)
  }
)

export const createArticleCategoryWorkflow = createWorkflow(
  "create-article-category",
  (input: CreateArticleCategoryInput) => {
    const category = createArticleCategoryStep(input)
    return new WorkflowResponse(category)
  }
)

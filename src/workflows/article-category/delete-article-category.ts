import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ARTICLE_MODULE } from "../../modules/article"
import ArticleModuleService from "../../modules/article/service"

type DeleteArticleCategoryInput = {
  id: string
}

const deleteArticleCategoryStep = createStep(
  "delete-article-category-step",
  async ({ id }: DeleteArticleCategoryInput, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    const category = await articleService.retrieveArticleCategory(id)
    await articleService.deleteArticleCategories(id)
    return new StepResponse(id, category)
  },
  async (category: Record<string, unknown>, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    await articleService.createArticleCategories(category as any)
  }
)

export const deleteArticleCategoryWorkflow = createWorkflow(
  "delete-article-category",
  (input: DeleteArticleCategoryInput) => {
    const id = deleteArticleCategoryStep(input)
    return new WorkflowResponse(id)
  }
)

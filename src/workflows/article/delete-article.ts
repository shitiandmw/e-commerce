import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ARTICLE_MODULE } from "../../modules/article"
import ArticleModuleService from "../../modules/article/service"

type DeleteArticleInput = {
  id: string
}

const deleteArticleStep = createStep(
  "delete-article-step",
  async ({ id }: DeleteArticleInput, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    const article = await articleService.retrieveArticle(id)
    await articleService.deleteArticles(id)
    return new StepResponse(id, article)
  },
  async (article: Record<string, unknown>, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    await articleService.createArticles(article as any)
  }
)

export const deleteArticleWorkflow = createWorkflow(
  "delete-article",
  (input: DeleteArticleInput) => {
    const id = deleteArticleStep(input)
    return new WorkflowResponse(id)
  }
)

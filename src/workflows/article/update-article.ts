import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ARTICLE_MODULE } from "../../modules/article"
import ArticleModuleService from "../../modules/article/service"

type UpdateArticleInput = {
  id: string
  title?: string
  slug?: string
  cover_image?: string | null
  summary?: string | null
  content?: string | null
  status?: string
  published_at?: string | null
  sort_order?: number
  is_pinned?: boolean
  category_id?: string | null
  translations?: Record<string, any> | null
  seo?: Record<string, any> | null
}

const updateArticleStep = createStep(
  "update-article-step",
  async (input: UpdateArticleInput, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    const existing = await articleService.retrieveArticle(input.id)
    const article = await articleService.updateArticles(input as any)
    return new StepResponse(article, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    await articleService.updateArticles(previous as any)
  }
)

export const updateArticleWorkflow = createWorkflow(
  "update-article",
  (input: UpdateArticleInput) => {
    const article = updateArticleStep(input)
    return new WorkflowResponse(article)
  }
)

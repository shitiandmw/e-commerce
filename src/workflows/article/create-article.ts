import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ARTICLE_MODULE } from "../../modules/article"
import ArticleModuleService from "../../modules/article/service"

type CreateArticleInput = {
  title: string
  slug: string
  cover_image?: string
  summary?: string
  content?: string
  status?: string
  published_at?: string
  sort_order?: number
  is_pinned?: boolean
  category_id?: string
  translations?: Record<string, any> | null
  seo?: Record<string, any> | null
}

const createArticleStep = createStep(
  "create-article-step",
  async (input: CreateArticleInput, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    const article = await articleService.createArticles(input as any)
    return new StepResponse(article, article.id)
  },
  async (articleId: string, { container }) => {
    const articleService: ArticleModuleService = container.resolve(ARTICLE_MODULE)
    await articleService.deleteArticles(articleId)
  }
)

export const createArticleWorkflow = createWorkflow(
  "create-article",
  (input: CreateArticleInput) => {
    const article = createArticleStep(input)
    return new WorkflowResponse(article)
  }
)

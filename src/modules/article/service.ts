import { MedusaService } from "@medusajs/framework/utils"
import { Article } from "./models/article"
import { ArticleCategory } from "./models/article-category"

class ArticleModuleService extends MedusaService({
  Article,
  ArticleCategory,
}) {}

export default ArticleModuleService

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

function applyLocale(entity: any, locale?: string) {
  if (!locale || !entity) return entity

  const translations = entity.translations
  if (!translations) return entity

  const localeData = translations[locale] || translations["zh-CN"]
  if (!localeData) return entity

  const result = { ...entity }
  if (localeData.title) result.title = localeData.title
  if (localeData.summary) result.summary = localeData.summary
  if (localeData.content) result.content = localeData.content
  return result
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const { slug } = req.params
  const url = new URL(req.url || "", `http://${req.headers.host}`)
  const locale = url.searchParams.get("locale") || undefined

  const { data: [article] } = await query.graph({
    entity: "article",
    fields: [
      "id", "title", "slug", "cover_image", "summary", "content",
      "status", "published_at", "sort_order", "is_pinned",
      "category_id", "category.*", "translations", "seo",
      "created_at", "updated_at",
    ],
    filters: { slug, status: "published" },
  })

  if (!article) {
    res.status(404).json({ message: "Article not found" })
    return
  }

  const plain = JSON.parse(JSON.stringify(article))
  const localized = applyLocale(plain, locale)

  // Auto-generate SEO defaults if not set
  if (!localized.seo || (!localized.seo.meta_title && !localized.seo.meta_description)) {
    localized.seo = {
      meta_title: localized.seo?.meta_title || localized.title?.slice(0, 60),
      meta_description: localized.seo?.meta_description || (localized.summary || "").slice(0, 160),
      og_image: localized.seo?.og_image || localized.cover_image || "",
      keywords: localized.seo?.keywords || "",
    }
  }

  res.json({ article: localized })
}

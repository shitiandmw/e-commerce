import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

function applyLocale(entity: any, locale?: string) {
  if (!locale || !entity) return entity

  const translations = entity.translations
  if (!translations) return entity

  const localeData = translations[locale] || translations["zh-CN"]
  if (!localeData) return entity

  const result = { ...entity }
  if (localeData.title) result.title = localeData.title
  if (localeData.content) result.content = localeData.content
  return result
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const url = new URL(req.url || "", `http://${req.headers.host}`)
  const locale = url.searchParams.get("locale") || undefined
  const offset = parseInt(url.searchParams.get("offset") || "0", 10)
  const limit = parseInt(url.searchParams.get("limit") || "20", 10)

  const { data: pages, metadata } = await query.graph({
    entity: "page",
    fields: [
      "id", "title", "slug", "content", "status", "template",
      "sort_order", "translations", "seo", "created_at", "updated_at",
    ],
    filters: { status: "published" },
    pagination: { skip: offset, take: limit, order: { sort_order: "ASC" } },
  })

  const plainPages = JSON.parse(JSON.stringify(pages))
  const localizedPages = plainPages.map((p: any) => applyLocale(p, locale))

  res.json({
    pages: localizedPages,
    count: metadata?.count || pages.length,
    offset,
    limit,
  })
}

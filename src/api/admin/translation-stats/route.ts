import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

/**
 * Resource type definitions for translatable entities.
 * Each entry maps a reference key to its entity name, display label,
 * translatable fields, and the field used as display name.
 */
const TRANSLATABLE_RESOURCES = [
  {
    reference: "article",
    entity: "article",
    label: "文章",
    labelEn: "Articles",
    fields: ["title", "summary", "content"],
    displayField: "title",
    queryFields: ["id", "title", "translations"],
  },
  {
    reference: "page",
    entity: "page",
    label: "页面",
    labelEn: "Pages",
    fields: ["title", "content"],
    displayField: "title",
    queryFields: ["id", "title", "translations"],
  },
  {
    reference: "brand",
    entity: "brand",
    label: "品牌",
    labelEn: "Brands",
    fields: ["name", "description"],
    displayField: "name",
    queryFields: ["id", "name"],
  },
  {
    reference: "menu_item",
    entity: "menu_item",
    label: "菜单项",
    labelEn: "Menu Items",
    fields: ["label"],
    displayField: "label",
    queryFields: ["id", "label"],
  },
  {
    reference: "banner_item",
    entity: "banner_item",
    label: "Banner",
    labelEn: "Banners",
    fields: ["title", "subtitle"],
    displayField: "title",
    queryFields: ["id", "title", "subtitle"],
  },
] as const

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const locale = req.query.locale as string | undefined

  const stats = []

  for (const resource of TRANSLATABLE_RESOURCES) {
    try {
      const { data: items } = await query.graph({
        entity: resource.entity,
        fields: resource.queryFields as unknown as string[],
      })

      const totalItems = items.length
      let translatedCount = 0

      if (locale) {
        // Count items that have translations for the specified locale
        for (const item of items) {
          const translations = (item as any).translations
          if (translations && translations[locale]) {
            const localeTranslations = translations[locale]
            const hasAny = resource.fields.some(
              (f) => localeTranslations[f] && localeTranslations[f].trim() !== ""
            )
            if (hasAny) translatedCount++
          }
        }
      }

      stats.push({
        reference: resource.reference,
        label: resource.label,
        labelEn: resource.labelEn,
        fields: resource.fields,
        displayField: resource.displayField,
        totalItems,
        translatedCount,
        items: items.map((item: any) => ({
          id: item.id,
          displayValue: item[resource.displayField] || item.id,
          translations: item.translations || {},
        })),
      })
    } catch {
      // If entity query fails, skip it
      stats.push({
        reference: resource.reference,
        label: resource.label,
        labelEn: resource.labelEn,
        fields: resource.fields,
        displayField: resource.displayField,
        totalItems: 0,
        translatedCount: 0,
        items: [],
      })
    }
  }

  res.json({ stats })
}

import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const TRANSLATABLE_RESOURCES = [
  {
    reference: "product",
    entity: "product",
    label: "商品",
    labelEn: "Products",
    fields: ["title", "subtitle", "description", "material"],
    displayField: "title",
  },
  {
    reference: "product_category",
    entity: "product_category",
    label: "商品分类",
    labelEn: "Product Categories",
    fields: ["name", "description"],
    displayField: "name",
  },
  {
    reference: "article",
    entity: "article",
    label: "文章",
    labelEn: "Articles",
    fields: ["title", "summary", "content"],
    displayField: "title",
  },
  {
    reference: "brand",
    entity: "brand",
    label: "品牌",
    labelEn: "Brands",
    fields: ["name", "description"],
    displayField: "name",
  },
  {
    reference: "menu_item",
    entity: "menu_item",
    label: "菜单项",
    labelEn: "Menu Items",
    fields: ["label"],
    displayField: "label",
  },
  {
    reference: "banner_item",
    entity: "banner_item",
    label: "Banner",
    labelEn: "Banners",
    fields: ["title", "subtitle", "cta_text"],
    displayField: "title",
  },
  {
    reference: "popup",
    entity: "popup",
    label: "弹窗",
    labelEn: "Popups",
    fields: ["title", "description", "button_text"],
    displayField: "title",
  },
  {
    reference: "announcement",
    entity: "announcement",
    label: "公告",
    labelEn: "Announcements",
    fields: ["text"],
    displayField: "text",
  },
  {
    reference: "curated_collection",
    entity: "curated_collection",
    label: "精选集",
    labelEn: "Curated Collections",
    fields: ["name", "description"],
    displayField: "name",
  },
] as const

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const queryService = req.scope.resolve("query")
  const translationModule = req.scope.resolve(Modules.TRANSLATION) as any
  const locale = req.query.locale as string | undefined

  const stats = []

  for (const resource of TRANSLATABLE_RESOURCES) {
    try {
      const { data: items } = await queryService.graph({
        entity: resource.entity,
        fields: ["id", ...resource.fields],
      })

      let transMap = new Map<string, Record<string, Record<string, string>>>()
      if (items.length > 0) {
        try {
          const trans = await translationModule.listTranslations({
            reference: resource.reference,
            reference_id: items.map((item: any) => item.id),
          })
          for (const t of trans) {
            if (!transMap.has(t.reference_id)) {
              transMap.set(t.reference_id, {})
            }
            transMap.get(t.reference_id)![t.locale_code] = t.translations || {}
          }
        } catch {}
      }

      let translatedCount = 0
      const mappedItems = items.map((item: any) => {
        const originalValues: Record<string, string> = {}
        for (const f of resource.fields) {
          originalValues[f] = item[f] || ""
        }
        const translations = transMap.get(item.id) || {}
        if (locale && translations[locale]) {
          const lt = translations[locale]
          if (resource.fields.some((f) => lt[f]?.trim())) translatedCount++
        }
        return {
          id: item.id,
          displayValue: item[resource.displayField] || item.id,
          originalValues,
          translations,
        }
      })

      stats.push({
        reference: resource.reference,
        label: resource.label,
        labelEn: resource.labelEn,
        fields: [...resource.fields],
        displayField: resource.displayField,
        totalItems: items.length,
        translatedCount,
        items: mappedItems,
      })
    } catch {
      stats.push({
        reference: resource.reference,
        label: resource.label,
        labelEn: resource.labelEn,
        fields: [...resource.fields],
        displayField: resource.displayField,
        totalItems: 0,
        translatedCount: 0,
        items: [],
      })
    }
  }

  res.json({ stats })
}
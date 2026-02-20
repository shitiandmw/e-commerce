import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

/**
 * Maps reference names to their entity and module service info.
 * The service method names follow Medusa convention: retrieve{Entity}, update{Entity}s
 */
const REFERENCE_MAP: Record<
  string,
  {
    entity: string
    moduleName: string
    retrieveMethod: string
    updateMethod: string
  }
> = {
  article: {
    entity: "article",
    moduleName: "article",
    retrieveMethod: "retrieveArticle",
    updateMethod: "updateArticles",
  },
  page: {
    entity: "page",
    moduleName: "page",
    retrieveMethod: "retrievePage",
    updateMethod: "updatePages",
  },
  brand: {
    entity: "brand",
    moduleName: "brand",
    retrieveMethod: "retrieveBrand",
    updateMethod: "updateBrands",
  },
  menu_item: {
    entity: "menu_item",
    moduleName: "menu",
    retrieveMethod: "retrieveMenuItem",
    updateMethod: "updateMenuItems",
  },
  banner_item: {
    entity: "banner_item",
    moduleName: "banner",
    retrieveMethod: "retrieveBannerItem",
    updateMethod: "updateBannerItems",
  },
}

/**
 * GET /admin/translations?reference=article&reference_id=xxx
 * Returns translations for a specific entity.
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const reference = req.query.reference as string
  const referenceId = req.query.reference_id as string

  if (!reference || !referenceId) {
    res.status(400).json({ message: "reference and reference_id are required" })
    return
  }

  const refConfig = REFERENCE_MAP[reference]
  if (!refConfig) {
    res.status(400).json({ message: `Unknown reference: ${reference}` })
    return
  }

  const query = req.scope.resolve("query")

  try {
    const { data: [entity] } = await query.graph({
      entity: refConfig.entity,
      fields: ["id", "translations"],
      filters: { id: referenceId },
    })

    if (!entity) {
      res.json({ translations: [] })
      return
    }

    const storedTranslations = (entity as any).translations || {}
    const result: Array<{
      id: string
      reference: string
      reference_id: string
      locale_code: string
      translations: Record<string, string>
    }> = []

    for (const [locale, fields] of Object.entries(storedTranslations)) {
      if (typeof fields === "object" && fields !== null) {
        result.push({
          id: `${referenceId}_${locale}`,
          reference,
          reference_id: referenceId,
          locale_code: locale,
          translations: fields as Record<string, string>,
        })
      }
    }

    res.json({ translations: result })
  } catch {
    res.json({ translations: [] })
  }
}

/**
 * POST /admin/translations
 * Body: { reference, reference_id, locale_code, translations: { field: value } }
 * Merges translations into the entity's translations JSON field.
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { reference, reference_id, locale_code, translations } = req.body as {
    reference: string
    reference_id: string
    locale_code: string
    translations: Record<string, string>
  }

  if (!reference || !reference_id || !locale_code || !translations) {
    res.status(400).json({
      message: "reference, reference_id, locale_code, and translations are required",
    })
    return
  }

  const refConfig = REFERENCE_MAP[reference]
  if (!refConfig) {
    res.status(400).json({ message: `Unknown reference: ${reference}` })
    return
  }

  try {
    const service = req.scope.resolve(refConfig.moduleName) as any

    // Retrieve current entity to get existing translations
    const entity = await service[refConfig.retrieveMethod](reference_id)
    const existingTranslations = entity.translations || {}

    // Merge new translations
    const updatedTranslations = {
      ...existingTranslations,
      [locale_code]: {
        ...(existingTranslations[locale_code] || {}),
        ...translations,
      },
    }

    // Update entity
    await service[refConfig.updateMethod]({
      id: reference_id,
      translations: updatedTranslations,
    })

    res.json({
      translation: {
        id: `${reference_id}_${locale_code}`,
        reference,
        reference_id,
        locale_code,
        translations: updatedTranslations[locale_code],
      },
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to save translation" })
  }
}

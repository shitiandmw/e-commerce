import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * GET /admin/translations?reference=article&reference_id=xxx
 * Returns translations for a specific entity from Translation Module.
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

  try {
    const translationModule = req.scope.resolve(Modules.TRANSLATION) as any
    const translations = await translationModule.listTranslations({
      reference,
      reference_id: referenceId,
    })
    res.json({
      translations: translations.map((t: any) => ({
        id: t.id,
        reference: t.reference,
        reference_id: t.reference_id,
        locale_code: t.locale_code,
        translations: t.translations || {},
      })),
    })
  } catch {
    res.json({ translations: [] })
  }
}

/**
 * POST /admin/translations
 * Body: { reference, reference_id, locale_code, translations: { field: value } }
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

  try {
    const translationModule = req.scope.resolve(Modules.TRANSLATION) as any

    // Check if translation already exists for this entity + locale
    const existing = await translationModule.listTranslations({
      reference,
      reference_id,
      locale_code,
    })

    let result: any
    if (existing.length > 0) {
      result = await translationModule.updateTranslations({
        id: existing[0].id,
        translations: { ...existing[0].translations, ...translations },
      })
    } else {
      result = await translationModule.createTranslations({
        reference,
        reference_id,
        locale_code,
        translations,
      })
    }

    res.json({
      translation: {
        id: result.id,
        reference,
        reference_id,
        locale_code,
        translations: result.translations || translations,
      },
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to save translation" })
  }
}
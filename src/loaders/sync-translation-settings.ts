import { MedusaContainer } from "@medusajs/framework/types"
import { DmlEntity, toSnakeCase, Modules } from "@medusajs/framework/utils"

/**
 * Sync translation_settings.fields with the actual translatable fields
 * defined in DML models. Medusa's built-in onApplicationStart_ only
 * creates new settings but never updates existing ones, so if a field
 * like cta_text is added to a model after the initial settings were
 * created, it won't be picked up.
 */
export default async function syncTranslationSettings(
  container: MedusaContainer
) {
  const translationModule = container.resolve(Modules.TRANSLATION) as any
  if (!translationModule) return

  const translatableEntities = DmlEntity.getTranslatableEntities()
  if (!translatableEntities.length) return

  const settingsService = (translationModule as any).settingsService_
  if (!settingsService) return

  const currentSettings = await settingsService.list()
  const settingsMap = new Map(
    currentSettings.map((s: any) => [s.entity_type, s])
  )

  const updates: any[] = []

  for (const entity of translatableEntities) {
    const entityType = toSnakeCase(entity.entity)
    const existing = settingsMap.get(entityType)
    if (!existing) continue

    const currentFields: string[] = existing.fields || []
    const modelFields: string[] = entity.fields || []

    // Check if model has fields not in settings
    const missingFields = modelFields.filter((f) => !currentFields.includes(f))
    if (missingFields.length > 0) {
      const mergedFields = [...currentFields, ...missingFields]
      updates.push({ id: existing.id, fields: mergedFields })
      console.log(
        `[sync-translation-settings] ${entityType}: adding fields [${missingFields.join(", ")}]`
      )
    }
  }

  if (updates.length > 0) {
    await settingsService.upsert(updates)
  }
}

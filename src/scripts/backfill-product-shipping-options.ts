import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  diffProductShippingOptionLinks,
  syncProductShippingOptions,
  validateShippingOptionIds,
} from "../lib/shipping-availability"
import { SHIPPING_AVAILABILITY_MODULE } from "../modules/shipping-availability"
import type ShippingAvailabilityModuleService from "../modules/shipping-availability/service"

export function parseBackfillArgs(argv: string[]) {
  const optionArg = argv.find((arg) => arg.startsWith("--option-ids="))
  const optionIds = optionArg
    ?.slice("--option-ids=".length)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean) ?? []
  return { optionIds, dryRun: argv.includes("--dry-run") }
}

export default async function backfillProductShippingOptions({
  container,
  args,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const service = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const { optionIds, dryRun } = parseBackfillArgs(args)
  await validateShippingOptionIds(container, optionIds)

  let offset = 0
  let processed = 0
  let changed = 0
  const limit = 100
  while (true) {
    const { data, metadata } = await query.graph({
      entity: "product",
      fields: ["id"],
      pagination: { skip: offset, take: limit },
    })
    for (const product of data ?? []) {
      const existing = await service.listProductShippingOptions({
        product_id: product.id,
      })
      const diff = diffProductShippingOptionLinks(existing, optionIds)
      if (diff.toCreate.length || diff.toDelete.length) {
        changed += 1
      }
      if (!dryRun && (diff.toCreate.length || diff.toDelete.length)) {
        await syncProductShippingOptions(container, product.id, optionIds)
      }
      processed += 1
    }
    offset += data?.length ?? 0
    if (!data?.length || offset >= (metadata?.count ?? offset)) break
  }

  logger.info(
    `${dryRun ? "Dry run:" : "Completed:"} scanned=${processed}, changed=${changed}, options=${optionIds.join(",")}`
  )
}

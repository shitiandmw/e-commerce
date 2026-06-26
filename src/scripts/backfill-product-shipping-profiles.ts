import { ExecArgs } from "@medusajs/framework/types"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

type ProductWithShippingProfile = {
  id: string
  title?: string | null
  shipping_profile?: { id: string } | null
}

type ScriptOptions = {
  execute: boolean
  limit: number
  sampleSize: number
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function parseOptions(args: string[] = []): ScriptOptions {
  const readValue = (name: string) => {
    const inline = args.find((arg) => arg.startsWith(`${name}=`))
    if (inline) return inline.slice(name.length + 1)

    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] : undefined
  }
  const readOption = (name: string) => {
    return readValue(name) ?? readValue(`--${name}`)
  }

  return {
    execute: args.includes("execute") || args.includes("--execute"),
    limit: parsePositiveInteger(readOption("limit"), 100),
    sampleSize: parsePositiveInteger(readOption("sample"), 10),
  }
}

async function listAllProductsMissingShippingProfile(
  query: any,
  limit: number
): Promise<ProductWithShippingProfile[]> {
  const missing: ProductWithShippingProfile[] = []
  let skip = 0

  while (true) {
    const { data, metadata } = await query.graph({
      entity: "product",
      fields: ["id", "title", "shipping_profile.id"],
      pagination: {
        skip,
        take: limit,
      },
    })
    const products = (data ?? []) as ProductWithShippingProfile[]

    missing.push(
      ...products.filter((product) => !product.shipping_profile?.id)
    )

    const total = metadata?.count ?? products.length
    skip += products.length

    if (products.length === 0 || skip >= total) {
      break
    }
  }

  return missing
}

export default async function backfillProductShippingProfiles({
  container,
  args,
}: ExecArgs) {
  const options = parseOptions(args)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)

  const defaultProfiles = await fulfillmentModuleService.listShippingProfiles(
    { type: "default" },
    { take: 1 }
  )
  const defaultProfile = defaultProfiles[0]

  if (!defaultProfile?.id) {
    throw new Error("No default shipping profile found.")
  }

  const missingProducts = await listAllProductsMissingShippingProfile(
    query,
    options.limit
  )
  const sample = missingProducts.slice(0, options.sampleSize)

  logger.info(
    [
      `Mode: ${options.execute ? "execute" : "dry-run"}`,
      `Default shipping profile: ${defaultProfile.id}`,
      `Products missing shipping profile: ${missingProducts.length}`,
    ].join("\n")
  )

  if (sample.length > 0) {
    logger.info(
      `Sample: ${sample
        .map((product) => `${product.id}${product.title ? ` (${product.title})` : ""}`)
        .join(", ")}`
    )
  }

  if (!options.execute) {
    logger.info("Dry run only. Re-run with execute to create missing links.")
    return
  }

  if (missingProducts.length === 0) {
    logger.info("No missing product shipping profile links to create.")
    return
  }

  await updateProductsWorkflow(container).run({
    input: {
      products: missingProducts.map((product) => ({
        id: product.id,
        shipping_profile_id: defaultProfile.id,
      })),
    },
  })

  logger.info(
    `Created default shipping profile links for ${missingProducts.length} product(s).`
  )
}

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type AuditOptionValue = {
  id: string
  value: string
  option_id?: string
}

type AuditOption = {
  id: string
  title: string
  values?: AuditOptionValue[]
}

type AuditVariant = {
  id: string
  title: string
  sku?: string | null
  options?: AuditOptionValue[]
  metadata?: Record<string, unknown> | null
}

export type VariantConfigurationAuditProduct = {
  id: string
  title: string
  options?: AuditOption[]
  variants?: AuditVariant[]
}

export type VariantConfigurationAuditIssue = {
  severity: "error" | "warning"
  code: string
  product_id: string
  variant_id?: string
  message: string
}

function identity(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase() || ""
}

export function auditProductVariantConfiguration(
  product: VariantConfigurationAuditProduct
): VariantConfigurationAuditIssue[] {
  const issues: VariantConfigurationAuditIssue[] = []
  const options = product.options || []
  const variants = product.variants || []
  const add = (
    severity: VariantConfigurationAuditIssue["severity"],
    code: string,
    message: string,
    variantId?: string
  ) => issues.push({
    severity,
    code,
    product_id: product.id,
    variant_id: variantId,
    message,
  })

  if (options.length === 0) {
    add("error", "NO_OPTIONS", "商品没有选项；单规格商品也应使用默认选项")
  }
  if (variants.length === 0) {
    add("error", "NO_VARIANTS", "商品没有规格")
  }

  const optionTitles = new Set<string>()
  const optionById = new Map(options.map((option) => [option.id, option]))
  const knownValueIds = new Set<string>()
  const usedValueIds = new Set<string>()
  for (const option of options) {
    const title = identity(option.title)
    if (!title || optionTitles.has(title)) {
      add("error", "DUPLICATE_OPTION_TITLE", `选项名称为空或重复：${option.title}`)
    }
    optionTitles.add(title)

    const valueNames = new Set<string>()
    for (const value of option.values || []) {
      knownValueIds.add(value.id)
      const valueName = identity(value.value)
      if (!valueName || valueNames.has(valueName)) {
        add(
          "error",
          "DUPLICATE_OPTION_VALUE",
          `选项“${option.title}”包含空值或重复值：${value.value}`
        )
      }
      valueNames.add(valueName)
    }
  }

  const signatures = new Map<string, string>()
  const skuOwners = new Map<string, string>()
  for (const variant of variants) {
    const sku = identity(variant.sku)
    if (!sku) {
      add("error", "MISSING_SKU", `规格“${variant.title}”没有 SKU`, variant.id)
    } else if (skuOwners.has(sku)) {
      add(
        "error",
        "DUPLICATE_SKU",
        `SKU ${variant.sku} 与规格 ${skuOwners.get(sku)} 重复`,
        variant.id
      )
    } else {
      skuOwners.set(sku, variant.id)
    }

    const valuesByOption = new Map<string, string>()
    for (const value of variant.options || []) {
      if (!value.option_id || !optionById.has(value.option_id)) {
        add(
          "error",
          "UNKNOWN_VARIANT_OPTION",
          `规格“${variant.title}”关联了不存在的选项`,
          variant.id
        )
        continue
      }
      if (!knownValueIds.has(value.id)) {
        add(
          "error",
          "UNKNOWN_VARIANT_OPTION_VALUE",
          `规格“${variant.title}”关联了不存在的选项值`,
          variant.id
        )
      }
      if (valuesByOption.has(value.option_id)) {
        add(
          "error",
          "DUPLICATE_VARIANT_OPTION",
          `规格“${variant.title}”在同一选项上关联了多个值`,
          variant.id
        )
      }
      valuesByOption.set(value.option_id, value.id)
      usedValueIds.add(value.id)
    }

    const missingOption = options.find((option) => !valuesByOption.has(option.id))
    if (missingOption) {
      add(
        "error",
        "INCOMPLETE_VARIANT_OPTIONS",
        `规格“${variant.title}”缺少选项“${missingOption.title}”`,
        variant.id
      )
      continue
    }

    const signature = options
      .map((option) => `${option.id}:${valuesByOption.get(option.id)}`)
      .sort()
      .join("|")
    const owner = signatures.get(signature)
    if (owner) {
      add(
        "error",
        "DUPLICATE_VARIANT_COMBINATION",
        `规格“${variant.title}”与规格 ${owner} 使用了相同选项组合`,
        variant.id
      )
    } else {
      signatures.set(signature, variant.id)
    }
  }

  for (const option of options) {
    for (const value of option.values || []) {
      if (!usedValueIds.has(value.id)) {
        add(
          "warning",
          "UNUSED_OPTION_VALUE",
          `选项“${option.title}”的值“${value.value}”没有关联任何规格`
        )
      }
    }
  }

  return issues
}

function readPositiveInteger(args: string[], name: string, fallback: number) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`))
  const value = inline?.slice(name.length + 1)
  const parsed = Number.parseInt(value || "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export default async function auditProductVariantConfigurations({
  container,
  args,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pageSize = readPositiveInteger(args, "--limit", 100)
  const sampleSize = readPositiveInteger(args, "--sample", 50)
  const dryRun = args.includes("--dry-run") || args.includes("dry-run")
  let skip = 0
  let scanned = 0
  const issues: VariantConfigurationAuditIssue[] = []

  while (true) {
    const { data, metadata } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "options.id",
        "options.title",
        "options.values.id",
        "options.values.value",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.metadata",
        "variants.options.id",
        "variants.options.value",
        "variants.options.option_id",
      ],
      pagination: { skip, take: pageSize },
    })
    const products = (data || []) as VariantConfigurationAuditProduct[]
    for (const product of products) {
      issues.push(...auditProductVariantConfiguration(product))
    }
    scanned += products.length
    skip += products.length
    if (products.length === 0 || skip >= (metadata?.count ?? skip)) break
  }

  const errors = issues.filter((issue) => issue.severity === "error")
  const warnings = issues.filter((issue) => issue.severity === "warning")
  logger.info(
    `${dryRun ? "Dry run" : "Read-only audit"}: scanned=${scanned}, errors=${errors.length}, warnings=${warnings.length}`
  )
  for (const issue of issues.slice(0, sampleSize)) {
    logger.info(
      `[${issue.severity}] ${issue.code} product=${issue.product_id}${
        issue.variant_id ? ` variant=${issue.variant_id}` : ""
      } ${issue.message}`
    )
  }
  if (issues.length > sampleSize) {
    logger.info(`Additional issues omitted: ${issues.length - sampleSize}`)
  }
}

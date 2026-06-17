import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type StoreProductTag = {
  id: string
  name: string
  color?: string | null
  type: "badge" | "attribute"
}

type ProductTagRecord = StoreProductTag & {
  products?: { id?: string | null }[] | null
}

function normalizeProductIds(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : []
  return Array.from(
    new Set(
      values
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const productIds = normalizeProductIds(
    req.query.product_id ?? req.query["product_id[]"] ?? req.query.ids
  )

  const productTags = Object.fromEntries(
    productIds.map((id) => [id, [] as StoreProductTag[]])
  )

  if (productIds.length === 0) {
    res.json({ product_tags: productTags })
    return
  }

  const productIdSet = new Set(productIds)
  const tags: ProductTagRecord[] = []
  const take = 100
  let skip = 0
  let total = Infinity

  while (skip < total) {
    const { data, metadata } = await query.graph({
      entity: "custom_tag",
      fields: ["id", "name", "color", "type", "products.id"],
      pagination: { skip, take },
    })

    tags.push(...((data || []) as ProductTagRecord[]))
    total = metadata?.count ?? tags.length
    skip += take

    if (!data?.length || metadata?.count == null) break
  }

  for (const tag of tags || []) {
    const publicTag: StoreProductTag = {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      type: tag.type,
    }

    for (const product of tag.products || []) {
      if (product?.id && productIdSet.has(product.id)) {
        productTags[product.id].push(publicTag)
      }
    }
  }

  res.json({ product_tags: productTags })
}

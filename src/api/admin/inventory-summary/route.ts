import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import {
  InventorySummaryItem,
  summarizeInventoryItems,
  withInventorySummaryFields,
} from "../../../lib/inventory-summary"

const SUMMARY_PAGE_SIZE = 500

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const statsItems: InventorySummaryItem[] = []
  const responseItems: unknown[] = []
  let skip = 0
  let count = 0

  do {
    const variables = {
      filters: req.filterableFields,
      skip,
      take: SUMMARY_PAGE_SIZE,
      order: req.queryConfig.pagination?.order,
    }
    const statsQuery = remoteQueryObjectFromString({
      entryPoint: "inventory_items",
      variables,
      fields: withInventorySummaryFields(req.queryConfig.fields),
    })
    const responseQuery = remoteQueryObjectFromString({
      entryPoint: "inventory_items",
      variables,
      fields: req.queryConfig.fields,
    })

    const [
      { rows: statsRows, metadata },
      { rows: responseRows },
    ] = await Promise.all([
      remoteQuery(statsQuery),
      remoteQuery(responseQuery),
    ])

    statsItems.push(...((statsRows || []) as InventorySummaryItem[]))
    responseItems.push(...(responseRows || []))
    count = metadata?.count ?? statsItems.length
    skip += SUMMARY_PAGE_SIZE
  } while (skip < count)

  res.status(200).json({
    inventory_items: responseItems,
    count,
    stats: summarizeInventoryItems(statsItems),
  })
}

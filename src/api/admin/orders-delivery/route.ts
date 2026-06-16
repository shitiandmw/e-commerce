import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getOrdersListWorkflow } from "@medusajs/core-flows"

type DeliveryType = "pickup" | "delivery"

const DEFAULT_FIELDS = [
  "id",
  "display_id",
  "status",
  "created_at",
  "updated_at",
  "email",
  "currency_code",
  "total",
  "subtotal",
  "tax_total",
  "shipping_total",
  "discount_total",
  "payment_status",
  "fulfillment_status",
  "items.*",
  "customer.*",
  "shipping_address.*",
  "shipping_methods.*",
  "fulfillments.*",
  "payment_collections.*",
]

const REQUIRED_FIELDS = [
  "id",
]

const COMPUTED_STATUS_FIELDS = new Set([
  "payment_status",
  "fulfillment_status",
])

const CANDIDATE_FIELDS = [
  "id",
  "display_id",
  "email",
  "status",
  "customer.email",
  "customer.first_name",
  "customer.last_name",
  "shipping_address.address_1",
  "shipping_address.address_2",
  "shipping_methods.name",
  "shipping_methods.metadata",
  "shipping_methods.shipping_option_id",
]

const PICKUP_NAME_MARKERS = ["pickup", "pick-up", "self-pick", "自提", "自取"]

function getQueryValue(query: MedusaRequest["query"], key: string) {
  const value = query[key] ?? query[`${key}[]`]
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === "string" && value) return [value]
  return []
}

function normalizeField(field: string) {
  if (field.startsWith("+")) return field.slice(1)
  if (field.startsWith("*")) return `${field.slice(1)}.*`
  return field
}

function parseFields(fields?: unknown) {
  const requestedFields =
    typeof fields === "string"
      ? fields
          .split(",")
          .map((field) => field.trim())
          .filter(Boolean)
      : DEFAULT_FIELDS
  const requested = requestedFields.map(normalizeField)

  return Array.from(new Set([...requested, ...REQUIRED_FIELDS]))
}

function parseOrder(value: string) {
  const descending = value.startsWith("-")
  const key = descending ? value.slice(1) : value
  if (!key) return { created_at: "DESC" as const }
  return { [key]: descending ? "DESC" : "ASC" }
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function getRawShippingMethodName(order: any) {
  const method = order.shipping_methods?.[0]
  const pickupName =
    normalize(order.shipping_address?.address_1) === "pickup order"
      ? order.shipping_address?.address_2
      : ""

  return method?.name || method?.shipping_option?.name || pickupName || ""
}

function getOrderDeliveryType(
  order: any,
  shippingOptionTypes: Map<string, DeliveryType>
): DeliveryType {
  for (const method of order.shipping_methods ?? []) {
    const metadataType = normalize(method.metadata?.type)
    if (metadataType === "pickup" || metadataType === "delivery") {
      return metadataType
    }

    const optionType = shippingOptionTypes.get(method.shipping_option_id)
    if (optionType) {
      return optionType
    }
  }

  if (normalize(order.shipping_address?.address_1) === "pickup order") {
    return "pickup"
  }

  const methodName = normalize(getRawShippingMethodName(order))
  if (PICKUP_NAME_MARKERS.some((marker) => methodName.includes(marker))) {
    return "pickup"
  }

  return "delivery"
}

function matchesSearch(order: any, q: string) {
  const needle = q.trim().toLowerCase()
  if (!needle) return true

  const customerName = [
    order.customer?.first_name,
    order.customer?.last_name,
  ]
    .filter(Boolean)
    .join(" ")

  const haystack = [
    order.id,
    order.display_id != null ? String(order.display_id) : "",
    order.email,
    order.customer?.email,
    customerName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(needle)
}

function matchesAny(value: unknown, accepted: string[]) {
  return accepted.length === 0 || accepted.includes(String(value || ""))
}

function getFilterValues(req: MedusaRequest, key: string) {
  const filterableFields = req.filterableFields ?? {}
  const value = filterableFields[key] ?? filterableFields[`${key}[]`]

  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === "string" && value) return [value]

  return getQueryValue(req.query, key)
}

function ensureFields(fields: string[], required: string[]) {
  return Array.from(new Set([...fields, ...required]))
}

function getWorkflowFields(fields: string[]) {
  return ensureFields(
    fields.filter((field) => !COMPUTED_STATUS_FIELDS.has(normalizeField(field))),
    ["id"]
  )
}

function getPagination(req: MedusaRequest) {
  const pagination = req.queryConfig?.pagination
  const offset =
    typeof pagination?.skip === "number"
      ? pagination.skip
      : Number.parseInt(String(req.query.offset ?? "0"), 10) || 0
  const limit =
    typeof pagination?.take === "number"
      ? pagination.take
      : Number.parseInt(String(req.query.limit ?? "20"), 10) || 20
  const order = pagination?.order ?? parseOrder(String(req.query.order || "-created_at"))

  return { offset, limit, order }
}

function getDeliveryType(req: MedusaRequest): DeliveryType | undefined {
  const deliveryType =
    (req.filterableFields?.delivery_type as DeliveryType | undefined) ??
    (req.query.delivery_type as DeliveryType | undefined)

  return deliveryType
}

function getSearchQuery(req: MedusaRequest) {
  const q = req.filterableFields?.q ?? req.query.q
  return typeof q === "string" ? q : ""
}

function getBaseOrderFilters(req: MedusaRequest) {
  const filters = { ...(req.filterableFields ?? {}) }

  delete filters.delivery_type
  delete filters.q
  delete filters.payment_status
  delete filters["payment_status[]"]
  delete filters.fulfillment_status
  delete filters["fulfillment_status[]"]

  if (!filters.status) {
    const statuses = getQueryValue(req.query, "status")
    if (statuses.length > 0) {
      filters.status = statuses
    }
  }

  return {
    ...filters,
    is_draft_order: false,
  }
}

async function getShippingOptionTypes(
  query: any,
  orders: any[]
): Promise<Map<string, DeliveryType>> {
  const ids = Array.from(
    new Set(
      orders.flatMap((order) =>
        (order.shipping_methods ?? [])
          .map((method: any) => method.shipping_option_id)
          .filter(Boolean)
      )
    )
  )

  if (ids.length === 0) {
    return new Map()
  }

  const { data } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "metadata"],
    filters: { id: ids },
  })

  return new Map(
    (data || []).flatMap((option: any) => {
      const type = normalize(option.metadata?.type)
      return type === "pickup" || type === "delivery"
        ? [[option.id, type as DeliveryType]]
        : []
    })
  )
}

async function getCandidateOrders(query: any, filters: Record<string, unknown>, order: any) {
  const pageSize = 500
  let skip = 0
  let total = 0
  const candidates: any[] = []

  do {
    const { data, metadata } = await query.graph({
      entity: "order",
      fields: CANDIDATE_FIELDS,
      filters,
      pagination: {
        skip,
        take: pageSize,
        order,
      },
    })

    candidates.push(...(data || []))
    total = metadata?.count ?? candidates.length
    skip += pageSize
  } while (skip < total)

  return candidates
}

async function getWorkflowOrders(
  req: MedusaRequest,
  ids: string[],
  filters: Record<string, unknown>,
  fields: string[],
  order: Record<string, string>
) {
  if (ids.length === 0) {
    return []
  }

  const workflow = getOrdersListWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: getWorkflowFields(fields),
      variables: {
        filters: {
          ...filters,
          id: ids,
          is_draft_order: false,
        },
        skip: 0,
        take: ids.length,
        order,
      },
    },
  })

  const rows = Array.isArray(result) ? result : result.rows
  const orderById = new Map((rows || []).map((order: any) => [order.id, order]))

  return ids
    .map((id) => orderById.get(id))
    .filter(Boolean)
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")

  const deliveryType = getDeliveryType(req)
  if (deliveryType !== "pickup" && deliveryType !== "delivery") {
    return res.status(400).json({ message: "Invalid delivery_type" })
  }

  const { offset, limit, order } = getPagination(req)
  const q = getSearchQuery(req)
  const filters = getBaseOrderFilters(req)
  const statuses = getFilterValues(req, "status")
  const paymentStatuses = getFilterValues(req, "payment_status")
  const fulfillmentStatuses = getFilterValues(req, "fulfillment_status")

  const fields = ensureFields(
    req.queryConfig?.fields ?? parseFields(req.query.fields),
    ["payment_status", "fulfillment_status"]
  )
  const candidates = await getCandidateOrders(query, filters, order)
  const shippingOptionTypes = await getShippingOptionTypes(query, candidates)

  const filtered = candidates.filter((order) => {
    return (
      getOrderDeliveryType(order, shippingOptionTypes) === deliveryType &&
      matchesSearch(order, q) &&
      matchesAny(order.status, statuses)
    )
  })

  const deliveryFilteredIds = filtered.map((order) => order.id)
  let filteredIds = deliveryFilteredIds

  if (paymentStatuses.length > 0 || fulfillmentStatuses.length > 0) {
    const statusRows = await getWorkflowOrders(
      req,
      deliveryFilteredIds,
      filters,
      ["id", "payment_status", "fulfillment_status"],
      order
    )
    const statusById = new Map(statusRows.map((order: any) => [order.id, order]))
    filteredIds = deliveryFilteredIds.filter((id) => {
      const row = statusById.get(id)
      return (
        row &&
        matchesAny(row.payment_status, paymentStatuses) &&
        matchesAny(row.fulfillment_status, fulfillmentStatuses)
      )
    })
  }

  const pageIds = filteredIds
    .slice(offset, offset + limit)
  const orders = await getWorkflowOrders(req, pageIds, filters, fields, order)

  res.json({
    orders,
    count: filteredIds.length,
    offset,
    limit,
  })
}

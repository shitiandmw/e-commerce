import http from "node:http"

const port = Number(process.env.PORT || 9439)
const upstream = new URL(process.env.UPSTREAM || "http://127.0.0.1:9438")
const candidateCount = Number(process.env.CANDIDATE_COUNT || 105)
const outOfStockCount = Number(process.env.OUT_OF_STOCK_COUNT || 69)
const requests = []
let failPriceRequest = 0
let priceCandidateRequestCount = 0

function virtualId(baseId, index) {
  return `${baseId}__e2e_${String(index).padStart(3, "0")}`
}

function parseVirtualId(id) {
  const match = /^(.*)__e2e_(\d+)$/.exec(id)
  return match ? { baseId: match[1], index: Number(match[2]) } : null
}

function parseVirtualHandle(handle) {
  const match = /^(.*)-e2e-(\d+)$/.exec(handle)
  return match ? { baseHandle: match[1], index: Number(match[2]) } : null
}

function originalIsOutOfStock(id) {
  let hash = 0
  for (const char of id) hash = (hash + char.charCodeAt(0)) % 997
  return hash % 2 === 0
}

function applyStock(product, isOutOfStock) {
  const variants = Array.isArray(product.variants) ? product.variants : []
  return {
    ...product,
    variants: variants.map((variant) => ({
      ...variant,
      inventory_quantity: isOutOfStock ? 0 : 8,
      manage_inventory: true,
    })),
  }
}

function fixturePrice(index) {
  if (index === 1) return 50
  if (index === outOfStockCount) return 99_999
  if (index === candidateCount) return 100
  if (index === candidateCount - 1) return 90_000
  if (index === outOfStockCount + 2 || index === outOfStockCount + 3) return 5_000
  return 1_000 + index * 100
}

function applyPrice(product, index) {
  const amount = fixturePrice(index)
  const variants = Array.isArray(product.variants) ? product.variants : []
  return {
    ...product,
    variants: variants.map((variant) => ({
      ...variant,
      calculated_price: {
        ...(variant.calculated_price || {}),
        calculated_amount: amount,
        original_amount: amount,
        currency_code: "usd",
      },
      prices: [{
        ...((Array.isArray(variant.prices) ? variant.prices[0] : undefined) || {}),
        amount,
        currency_code: "usd",
      }],
    })),
  }
}

function cloneProduct(base, index) {
  const suffix = String(index).padStart(3, "0")
  const cloned = {
    ...base,
    id: virtualId(base.id, index),
    title: base.title ? `${base.title} E2E ${suffix}` : base.title,
    handle: base.handle ? `${base.handle}-e2e-${suffix}` : base.handle,
    variants: Array.isArray(base.variants)
      ? base.variants.map((variant, variantIndex) => ({
          ...variant,
          id: variant.id ? `${variant.id}__e2e_${suffix}_${variantIndex}` : variant.id,
        }))
      : base.variants,
  }
  return applyStock(applyPrice(cloned, index), index <= outOfStockCount)
}

function responseHeaders(headers) {
  const result = {}
  for (const [key, value] of headers) {
    if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(key)) {
      result[key] = value
    }
  }
  return result
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function upstreamFetch(req, target, body) {
  const headers = { ...req.headers }
  delete headers.host
  const init = { method: req.method, headers, redirect: "manual" }
  if (body.length && !["GET", "HEAD"].includes(req.method || "GET")) init.body = body
  return fetch(target, init)
}

async function loadFixtureBase(req) {
  const target = new URL("/store/products", upstream)
  target.searchParams.set("limit", "100")
  target.searchParams.set("fields", "id,title,handle,thumbnail,*variants,*variants.prices,*variants.metadata,*categories,*brand")
  const response = await upstreamFetch(req, target, Buffer.alloc(0))
  if (!response.ok) return []
  const data = await response.json()
  return Array.isArray(data.products) ? data.products : []
}

async function transformProducts(req, target) {
  const requestedIds = target.searchParams.getAll("id[]")
  const requestedHandle = target.searchParams.get("handle")

  if (requestedIds.length) {
    const requestedLimit = Math.max(0, Number(target.searchParams.get("limit") || requestedIds.length))
    const requestedOffset = Math.max(0, Number(target.searchParams.get("offset") || 0))
    const baseIds = [...new Set(requestedIds.map((id) => parseVirtualId(id)?.baseId || id))]
    target.searchParams.delete("id[]")
    for (const id of baseIds) target.searchParams.append("id[]", id)
    target.searchParams.set("limit", String(baseIds.length))
    target.searchParams.set("offset", "0")

    const response = await upstreamFetch(req, target, Buffer.alloc(0))
    const data = await response.json()
    const byId = new Map((data.products || []).map((product) => [product.id, product]))
    const allProducts = requestedIds.flatMap((id) => {
      const virtual = parseVirtualId(id)
      const base = byId.get(virtual?.baseId || id)
      if (!base) return []
      return virtual
        ? [cloneProduct(base, virtual.index)]
        : [applyStock(base, originalIsOutOfStock(id))]
    })
    const products = allProducts.slice(requestedOffset, requestedOffset + requestedLimit)
    return {
      response,
      data: {
        ...data,
        products,
        count: allProducts.length,
        offset: requestedOffset,
        limit: requestedLimit,
      },
    }
  }

  const virtualHandle = requestedHandle ? parseVirtualHandle(requestedHandle) : null
  if (virtualHandle) target.searchParams.set("handle", virtualHandle.baseHandle)

  const requestedLimit = Math.max(0, Number(target.searchParams.get("limit") || 20))
  const requestedOffset = Math.max(0, Number(target.searchParams.get("offset") || 0))
  // The local Medusa fixture database can spin on the category relation query.
  // Use the same real products as controlled samples while the browser still
  // exercises the storefront's category route, prioritization, and pagination.
  target.searchParams.delete("category_id[]")
  target.searchParams.set("limit", "100")
  target.searchParams.set("offset", "0")
  const response = await upstreamFetch(req, target, Buffer.alloc(0))
  const data = await response.json()
  const baseProducts = Array.isArray(data.products) ? data.products : []

  if (virtualHandle) {
    const products = baseProducts.length ? [cloneProduct(baseProducts[0], virtualHandle.index)] : []
    return {
      response,
      data: { ...data, products, count: products.length, offset: 0, limit: products.length },
    }
  }

  if (!baseProducts.length) return { response, data }
  const products = Array.from({ length: candidateCount }, (_, index) =>
    cloneProduct(baseProducts[index % baseProducts.length], index + 1),
  )
  return {
    response,
    data: {
      ...data,
      products: products.slice(requestedOffset, requestedOffset + requestedLimit),
      count: products.length,
      offset: requestedOffset,
      limit: requestedLimit,
    },
  }
}

async function transformBrand(req, target) {
  const response = await upstreamFetch(req, target, Buffer.alloc(0))
  const data = await response.json()
  if (!data.brand) return { response, data }

  const baseProducts = await loadFixtureBase(req)
  const preferred = baseProducts.find((product) => product.handle === "cohiba-siglo-vi") || baseProducts[0]
  if (!preferred) return { response, data }
  data.brand.products = Array.from({ length: candidateCount }, (_, index) => ({
    id: virtualId(preferred.id, index + 1),
  }))
  return { response, data }
}

function addFixtureTabs(data) {
  for (const collection of data.collections || []) {
    if (collection.key !== "hot-picks" || !Array.isArray(collection.items)) continue
    const midpoint = Math.ceil(collection.items.length / 2)
    const firstTab = { id: "e2e-tab-a", name: "E2E A", key: "e2e-a", sort_order: 0 }
    const secondTab = { id: "e2e-tab-b", name: "E2E B", key: "e2e-b", sort_order: 1 }
    collection.tabs = [firstTab, secondTab]
    collection.items = collection.items.map((item, index) => ({
      ...item,
      tab_id: index < midpoint ? firstTab.id : secondTab.id,
    }))
  }
  return data
}

function requestKind(target) {
  if (target.pathname !== "/store/products") return "other"
  const fields = target.searchParams.get("fields") || ""
  if (fields === "id") return "ids"
  if (fields === "id,*variants.inventory_quantity,*variants.manage_inventory,*variants.metadata") {
    return "stock-candidates"
  }
  if (
    fields === "id,*variants.inventory_quantity,*variants.manage_inventory,*variants.metadata,*variants.calculated_price,*variants.prices"
  ) {
    return "price-candidates"
  }
  if (target.searchParams.getAll("id[]").length) return "details"
  return "list"
}

function recordRequest(req, target, status, startedAt) {
  const originalTarget = new URL(req.url || "/", "http://fixture")
  requests.push({
    method: req.method,
    path: originalTarget.pathname,
    query: originalTarget.search,
    kind: requestKind(originalTarget),
    status,
    durationMs: Math.round((performance.now() - startedAt) * 10) / 10,
  })
}

const server = http.createServer(async (req, res) => {
  const startedAt = performance.now()
  const target = new URL(req.url || "/", upstream)

  if (target.pathname === "/__e2e/stats") {
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify({
      candidateCount,
      outOfStockCount,
      failPriceRequest,
      priceCandidateRequestCount,
      requests,
    }, null, 2))
    return
  }
  if (target.pathname === "/__e2e/reset") {
    requests.length = 0
    priceCandidateRequestCount = 0
    failPriceRequest = 0
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify({ ok: true }))
    return
  }
  if (target.pathname === "/__e2e/fail-price") {
    const body = await readBody(req)
    const data = body.length ? JSON.parse(body.toString("utf8")) : {}
    requests.length = 0
    priceCandidateRequestCount = 0
    failPriceRequest = Math.max(0, Number(data.request || 0))
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify({ ok: true, failPriceRequest }))
    return
  }

  try {
    const body = await readBody(req)
    if (requestKind(target) === "price-candidates") {
      priceCandidateRequestCount += 1
      if (priceCandidateRequestCount === failPriceRequest) {
        res.writeHead(503, { "content-type": "application/json" })
        res.end(JSON.stringify({ error: "E2E injected price candidate failure" }))
        recordRequest(req, target, 503, startedAt)
        return
      }
    }
    let response
    let payload

    if (req.method === "GET" && target.pathname === "/store/products") {
      const transformed = await transformProducts(req, target)
      response = transformed.response
      payload = Buffer.from(JSON.stringify(transformed.data))
    } else if (req.method === "GET" && /^\/store\/content\/brands\/[^/]+$/.test(target.pathname)) {
      const transformed = await transformBrand(req, target)
      response = transformed.response
      payload = Buffer.from(JSON.stringify(transformed.data))
    } else if (req.method === "GET" && target.pathname === "/store/content/collections") {
      response = await upstreamFetch(req, target, body)
      const data = addFixtureTabs(await response.json())
      payload = Buffer.from(JSON.stringify(data))
    } else {
      response = await upstreamFetch(req, target, body)
      payload = Buffer.from(await response.arrayBuffer())
    }

    res.writeHead(response.status, responseHeaders(response.headers))
    res.end(payload)
    recordRequest(req, target, response.status, startedAt)
  } catch (error) {
    res.writeHead(502, { "content-type": "application/json" })
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
    recordRequest(req, target, 502, startedAt)
  }
})

server.listen(port, "127.0.0.1", () => {
  console.log(`stock fixture proxy ready on http://127.0.0.1:${port}`)
})

import { authFetch, getToken } from "./auth"

const RESTOCK_VISITOR_KEY = "restock_visitor_id"

type RestockStatus = {
  requested: boolean
  round_id: string | null
  requester_count: number
}
function createVisitorId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `browser_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function getRestockVisitorId() {
  let visitorId = localStorage.getItem(RESTOCK_VISITOR_KEY)
  if (!visitorId) {
    visitorId = createVisitorId()
    localStorage.setItem(RESTOCK_VISITOR_KEY, visitorId)
  }
  return visitorId
}

function getRestockEndpoint() {
  return getToken()
    ? "/api/restock-requests/customer"
    : "/api/restock-requests"
}

export async function getRestockStatus(variantId: string): Promise<RestockStatus> {
  const params = new URLSearchParams({ variant_id: variantId })
  if (!getToken()) params.set("visitor_id", getRestockVisitorId())

  const response = await authFetch(`${getRestockEndpoint()}?${params.toString()}`, {
    cache: "no-store",
  })
  if (!response.ok) throw new Error("RESTOCK_STATUS_FAILED")
  return response.json()
}

export async function requestRestock(variantId: string): Promise<RestockStatus> {
  const body: Record<string, string> = { variant_id: variantId }
  if (!getToken()) body.visitor_id = getRestockVisitorId()

  const response = await authFetch(getRestockEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error("RESTOCK_REQUEST_FAILED")
  return response.json()
}

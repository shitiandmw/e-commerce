import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { reconcilePendingRestockRounds } from "../../../lib/restock-demand"
import { RESTOCK_DEMAND_MODULE } from "../../../modules/restock-demand"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await reconcilePendingRestockRounds(req.scope)

  const service = req.scope.resolve(RESTOCK_DEMAND_MODULE) as any
  const status = (req.query.status as string) || "pending"
  const offset = Math.max(0, Number(req.query.offset) || 0)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
  const filters = status === "all" ? {} : { status }
  const rounds = await service.listRestockRounds(filters, {
    relations: ["requests"],
    order: { created_at: "DESC" },
  })

  const demands = rounds.map((round: any) => {
    const requests = round.requests || []
    const lastRequestedAt = requests.reduce(
      (latest: Date | null, request: any) => {
        const current = new Date(request.created_at)
        return !latest || current > latest ? current : latest
      },
      null
    )
    const loggedUsers = requests.filter((request: any) => request.customer_id).map((request: any) => ({
      customer_id: request.customer_id,
      email: request.customer_email,
      first_name: request.customer_first_name,
      last_name: request.customer_last_name,
      requested_at: request.created_at,
    }))

    return {
      id: round.id,
      variant_id: round.variant_id,
      product_id: round.product_id,
      product_title: round.product_title,
      variant_title: round.variant_title,
      sku: round.sku,
      specification: round.specification || [],
      status: round.status,
      requester_count: requests.length,
      logged_user_count: loggedUsers.length,
      anonymous_count: requests.length - loggedUsers.length,
      last_requested_at: lastRequestedAt?.toISOString() || round.created_at,
      restocked_at: round.restocked_at,
      created_at: round.created_at,
      logged_users: loggedUsers,
    }
  }).sort((a: any, b: any) => (
    new Date(b.last_requested_at).getTime() - new Date(a.last_requested_at).getTime()
  ))

  res.json({
    restock_demands: demands.slice(offset, offset + limit),
    count: demands.length,
    offset,
    limit,
  })
}

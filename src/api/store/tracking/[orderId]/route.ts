import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TRACKING_MODULE } from "../../../../modules/tracking"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { orderId } = req.params
  const customerId = req.auth_context?.actor_id

  const query = req.scope.resolve("query")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "fulfillments.id", "fulfillments.shipped_at", "fulfillments.delivered_at", "fulfillments.labels.*"],
    filters: { id: orderId },
  })

  if (!orders || orders.length === 0) {
    return res.status(404).json({ message: "Order not found" })
  }

  const order = orders[0] as any
  if (customerId && order.customer_id !== customerId) {
    return res.status(403).json({ message: "Access denied" })
  }

  const fulfillments = order.fulfillments || []
  const fulfillmentIds = fulfillments.map((f: any) => f.id)

  if (fulfillmentIds.length === 0) {
    return res.json({ tracking: [] })
  }

  const trackingService = req.scope.resolve(TRACKING_MODULE)

  const trackingRecords = await trackingService.listTrackingRecords(
    { fulfillment_id: fulfillmentIds },
    { relations: ["events"], order: { created_at: "DESC" } }
  )

  const result = trackingRecords.map((record: any) => {
    const ful = fulfillments.find((f: any) => f.id === record.fulfillment_id)
    const sortedEvents = (record.events || []).sort(
      (a: any, b: any) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    )
    return {
      id: record.id,
      tracking_number: record.tracking_number,
      carrier: record.carrier,
      carrier_name: record.carrier_name,
      status: record.status,
      tracking_url: record.tracking_url,
      estimated_delivery: record.estimated_delivery,
      shipped_at: ful?.shipped_at,
      delivered_at: ful?.delivered_at,
      events: sortedEvents.map((e: any) => ({
        status: e.status,
        description: e.description,
        location: e.location,
        occurred_at: e.occurred_at,
      })),
    }
  })

  res.json({ tracking: result })
}

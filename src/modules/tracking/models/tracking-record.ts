import { model } from "@medusajs/framework/utils"

const TrackingRecord = model.define("tracking_record", {
  id: model.id().primaryKey(),
  tracking_number: model.text(),
  carrier: model.text(),
  carrier_name: model.text(),
  status: model.enum(["pending", "in_transit", "out_for_delivery", "delivered", "exception", "expired"]).default("pending"),
  tracking_url: model.text().nullable(),
  last_synced_at: model.dateTime().nullable(),
  estimated_delivery: model.dateTime().nullable(),
  raw_data: model.json().nullable(),
  fulfillment_id: model.text(),
  events: model.hasMany(() => TrackingEvent),
})

const TrackingEvent = model.define("tracking_event", {
  id: model.id().primaryKey(),
  tracking_record: model.belongsTo(() => TrackingRecord, { mappedBy: "events" }),
  status: model.text(),
  description: model.text(),
  location: model.text().nullable(),
  occurred_at: model.dateTime(),
})

export { TrackingRecord, TrackingEvent }

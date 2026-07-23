import { model } from "@medusajs/framework/utils"
import { RestockRequester } from "./restock-requester"

export const RestockRound = model.define("restock_round", {
  id: model.id().primaryKey(),
  variant_id: model.text(),
  product_id: model.text(),
  product_title: model.text(),
  variant_title: model.text().nullable(),
  sku: model.text().nullable(),
  specification: model.json().nullable(),
  status: model.enum(["pending", "restocked", "discontinued"]).default("pending"),
  restocked_at: model.dateTime().nullable(),
  requests: model.hasMany(() => RestockRequester, {
    mappedBy: "round",
  }),
})

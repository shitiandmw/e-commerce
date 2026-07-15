import { model } from "@medusajs/framework/utils"
import { RestockRound } from "./restock-round"

export const RestockRequester = model.define("restock_requester", {
  id: model.id().primaryKey(),
  round: model.belongsTo(() => RestockRound, {
    mappedBy: "requests",
  }),
  identity_key: model.text(),
  customer_id: model.text().nullable(),
  visitor_id: model.text().nullable(),
  customer_email: model.text().nullable(),
  customer_first_name: model.text().nullable(),
  customer_last_name: model.text().nullable(),
})

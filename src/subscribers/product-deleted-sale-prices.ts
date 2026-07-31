import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { deleteManagedProductSalePrices } from "../lib/product-sale-pricing"

export default async function productDeletedSalePrices({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await deleteManagedProductSalePrices(container, data.id)
}

export const config: SubscriberConfig = {
  event: "product.deleted",
}

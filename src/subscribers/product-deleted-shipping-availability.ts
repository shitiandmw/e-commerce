import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { SHIPPING_AVAILABILITY_MODULE } from "../modules/shipping-availability"
import type ShippingAvailabilityModuleService from "../modules/shipping-availability/service"

export default async function productDeletedShippingAvailability({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const service = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const links = await service.listProductShippingOptions({ product_id: data.id })
  if (links.length) {
    await service.deleteProductShippingOptions(links.map((link: any) => link.id))
  }
}

export const config: SubscriberConfig = {
  event: "product.deleted",
}

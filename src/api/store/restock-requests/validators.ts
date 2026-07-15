import { z } from "zod"

const RestockVariant = z.object({
  variant_id: z.string().min(1),
})

const RestockVisitor = z.object({
  visitor_id: z.string().min(8).max(128),
})

export const StoreAnonymousRestockRequestBody = RestockVariant.merge(RestockVisitor)
export const StoreAnonymousRestockRequestQuery = RestockVariant.merge(RestockVisitor)
export const StoreCustomerRestockRequestBody = RestockVariant
export const StoreCustomerRestockRequestQuery = RestockVariant

export type StoreAnonymousRestockRequestBodyType = z.infer<
  typeof StoreAnonymousRestockRequestBody
>
export type StoreCustomerRestockRequestBodyType = z.infer<
  typeof StoreCustomerRestockRequestBody
>

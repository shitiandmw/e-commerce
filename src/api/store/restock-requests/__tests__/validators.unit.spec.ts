import {
  StoreAnonymousRestockRequestBody,
  StoreAnonymousRestockRequestQuery,
  StoreCustomerRestockRequestBody,
  StoreCustomerRestockRequestQuery,
} from "../validators"

describe("restock request route validators", () => {
  it.each([
    StoreAnonymousRestockRequestBody,
    StoreAnonymousRestockRequestQuery,
  ])("rejects an anonymous request without visitor_id", (schema) => {
    expect(schema.safeParse({ variant_id: "variant_1" }).success).toBe(false)
  })

  it.each([
    StoreCustomerRestockRequestBody,
    StoreCustomerRestockRequestQuery,
  ])("accepts an authenticated request without visitor_id", (schema) => {
    expect(schema.safeParse({ variant_id: "variant_1" }).success).toBe(true)
  })
})

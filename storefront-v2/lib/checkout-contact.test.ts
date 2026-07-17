import { describe, expect, it } from "vitest"
import {
  buildPickupCartContact,
  CHECKOUT_SERVICE_ZONE_INVALID,
  getCheckoutCartErrorTranslationKey,
  validatePickupContact,
} from "./checkout-contact"

const validContact = {
  firstName: "Ada",
  lastName: "Lovelace",
  phone: "+852 1234 5678",
  email: "ada@example.com",
}

describe("validatePickupContact", () => {
  it.each([
    ["firstName", "", "first_name_required"],
    ["firstName", "   ", "first_name_required"],
    ["lastName", "", "last_name_required"],
    ["lastName", "   ", "last_name_required"],
    ["phone", "", "phone_required"],
    ["phone", "   ", "phone_required"],
    ["email", "", "email_required"],
    ["email", "   ", "email_required"],
    ["email", "not-an-email", "email_invalid"],
  ] as const)("rejects %s=%j", (field, value, expected) => {
    expect(validatePickupContact({ ...validContact, [field]: value }))
      .toBe(expected)
  })

  it("accepts a complete contact and ignores surrounding whitespace", () => {
    expect(validatePickupContact({
      firstName: " Ada ",
      lastName: " Lovelace ",
      phone: " +852 1234 5678 ",
      email: " ada@example.com ",
    })).toBeNull()
  })

  it("builds a pickup payload without pickup-location structured fields", () => {
    expect(buildPickupCartContact({
      firstName: " Ada ",
      lastName: " Lovelace ",
      phone: " +852 1234 5678 ",
      email: "ada@example.com",
    })).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      phone: "+852 1234 5678",
    })
  })
})

describe("getCheckoutCartErrorTranslationKey", () => {
  it("maps an invalid shipping-option service zone to localized checkout copy", () => {
    expect(getCheckoutCartErrorTranslationKey(CHECKOUT_SERVICE_ZONE_INVALID))
      .toBe("checkout_pickup_service_zone_invalid")
  })

  it("keeps unknown cart errors on the generic fallback path", () => {
    expect(getCheckoutCartErrorTranslationKey("SHIPPING_OPTION_UNAVAILABLE"))
      .toBeNull()
    expect(getCheckoutCartErrorTranslationKey()).toBeNull()
  })
})

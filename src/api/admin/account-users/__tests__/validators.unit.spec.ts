import {
  PostAdminChangeOwnPassword,
  PostAdminCreateAccountUser,
  PostAdminResetAccountUserPassword,
  PostAdminUpdateAccountUser,
} from "../validators"

describe("account user validators", () => {
  it("accepts a valid admin account creation payload", () => {
    const result = PostAdminCreateAccountUser.parse({
      email: " Admin@Example.COM ",
      first_name: "Ada",
      last_name: "Lovelace",
      password: "StrongPass1",
      confirm_password: "StrongPass1",
    })

    expect(result.email).toBe("admin@example.com")
  })

  it("rejects weak passwords", () => {
    const result = PostAdminCreateAccountUser.safeParse({
      email: "admin@example.com",
      password: "weakpass",
      confirm_password: "weakpass",
    })

    expect(result.success).toBe(false)
  })

  it("rejects mismatched password confirmation", () => {
    const result = PostAdminResetAccountUserPassword.safeParse({
      password: "StrongPass1",
      confirm_password: "StrongPass2",
    })

    expect(result.success).toBe(false)
  })

  it("requires the new password to differ from the current password", () => {
    const result = PostAdminChangeOwnPassword.safeParse({
      current_password: "StrongPass1",
      password: "StrongPass1",
      confirm_password: "StrongPass1",
    })

    expect(result.success).toBe(false)
  })

  it("does not require email in update payloads", () => {
    const result = PostAdminUpdateAccountUser.parse({
      first_name: "Grace",
      last_name: null,
    })

    expect(result).toEqual({
      first_name: "Grace",
      last_name: null,
    })
  })
})

import {
  buildPasswordResetEmail,
  GmailSmtpNotificationService,
} from "../providers/gmail-smtp/service"

describe("Gmail SMTP notification provider", () => {
  it("builds an escaped password reset email", () => {
    const email = buildPasswordResetEmail({
      email: "customer@example.com",
      reset_url: "https://store.example.com/reset-password?token=abc&email=x%40y.com",
      expires_in_minutes: 15,
    })

    expect(email.subject).toBe("Reset your SHANGJIA password")
    expect(email.text).toContain("https://store.example.com/reset-password")
    expect(email.html).toContain("token=abc&amp;email=x%40y.com")
  })

  it("sends password reset notifications through the configured transporter", async () => {
    const logger = { error: jest.fn() }
    const service = new GmailSmtpNotificationService(
      { logger } as never,
      {
        user: "sender@gmail.com",
        pass: "app-password",
      }
    )
    const sendMail = jest.fn().mockResolvedValue({ messageId: "smtp-message-id" })
    ;(service as any).transporter_ = { sendMail }

    const result = await service.send({
      to: "customer@example.com",
      channel: "email",
      template: "password-reset",
      data: {
        email: "customer@example.com",
        reset_url: "https://store.example.com/reset-password?token=abc",
        expires_in_minutes: 15,
      },
    })

    expect(result).toEqual({ id: "smtp-message-id" })
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: "customer@example.com",
      from: "sender@gmail.com",
      subject: "Reset your SHANGJIA password",
      text: expect.stringContaining("token=abc"),
      html: expect.stringContaining("Reset your SHANGJIA password"),
    }))
  })

  it("rejects a password reset notification without a reset URL", () => {
    expect(() => buildPasswordResetEmail({ email: "customer@example.com" })).toThrow(
      "Password reset notification is missing reset_url"
    )
  })
})

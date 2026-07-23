import type {
  Logger,
  NotificationTypes,
} from "@medusajs/framework/types"
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import nodemailer, { type Transporter } from "nodemailer"

type GmailSmtpOptions = {
  host?: string
  port?: string | number
  secure?: string | boolean
  user: string
  pass: string
  from?: string
}

type GmailSmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

type PasswordResetData = {
  email?: unknown
  reset_url?: unknown
  expires_in_minutes?: unknown
}

function parseBoolean(value: string | boolean | undefined) {
  return value === true || String(value).toLowerCase() === "true"
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function buildPasswordResetEmail(data: PasswordResetData) {
  const email = typeof data.email === "string" ? data.email : ""
  const resetUrl = typeof data.reset_url === "string" ? data.reset_url : ""
  const expiresInMinutes =
    typeof data.expires_in_minutes === "number" ? data.expires_in_minutes : 15

  if (!resetUrl) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Password reset notification is missing reset_url"
    )
  }

  const safeEmail = escapeHtml(email)
  const safeResetUrl = escapeHtml(resetUrl)
  const subject = "Reset your SHANGJIA password"
  const text = [
    `Hello${email ? ` ${email}` : ""},`,
    "",
    "Use the link below to reset your SHANGJIA password:",
    resetUrl,
    "",
    `This link expires in ${expiresInMinutes} minutes and can only be used once.`,
  ].join("\n")
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f7f5f0;color:#1f1f1f;font-family:Arial,sans-serif;line-height:1.6">
    <div style="max-width:560px;margin:32px auto;padding:32px;background:#fff;border:1px solid #e5e0d7">
      <h1 style="margin:0 0 24px;font-size:24px">Reset your SHANGJIA password</h1>
      <p>Hello${safeEmail ? ` ${safeEmail}` : ""},</p>
      <p>Use the button below to choose a new password.</p>
      <p style="margin:28px 0;text-align:center">
        <a href="${safeResetUrl}" style="display:inline-block;padding:12px 20px;background:#b08d57;color:#fff;text-decoration:none">Reset password</a>
      </p>
      <p style="font-size:14px;color:#666">This link expires in ${expiresInMinutes} minutes and can only be used once.</p>
      <p style="font-size:13px;color:#777;word-break:break-all">If the button does not work, open this URL:<br>${safeResetUrl}</p>
    </div>
  </body>
</html>`

  return { subject, text, html }
}

export class GmailSmtpNotificationService extends AbstractNotificationProviderService {
  static identifier = "notification-gmail-smtp"

  private readonly config_: GmailSmtpConfig
  private readonly logger_: Logger
  private readonly transporter_: Transporter

  constructor(
    { logger }: { logger: Logger },
    options: GmailSmtpOptions
  ) {
    super()

    const port = Number(options.port || 587)
    if (!Number.isInteger(port) || port <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "SMTP_PORT must be a positive integer"
      )
    }
    if (!options.user || !options.pass) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "SMTP_USER and SMTP_PASS are required"
      )
    }

    this.config_ = {
      host: options.host || "smtp.gmail.com",
      port,
      secure: parseBoolean(options.secure),
      user: options.user,
      pass: options.pass,
      from: options.from || options.user,
    }
    this.logger_ = logger
    this.transporter_ = nodemailer.createTransport({
      host: this.config_.host,
      port: this.config_.port,
      secure: this.config_.secure,
      auth: {
        user: this.config_.user,
        pass: this.config_.pass,
      },
    })
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No notification information provided"
      )
    }

    const content = notification.content?.html || notification.content?.text
      ? notification.content
      : notification.template === "password-reset"
        ? buildPasswordResetEmail(notification.data || {})
        : null

    if (!content?.html && !content?.text) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `SMTP notification template '${notification.template}' has no email content`
      )
    }

    try {
      const result = await this.transporter_.sendMail({
        to: notification.to,
        from: notification.from?.trim() || this.config_.from,
        subject: content.subject || notification.template,
        text: content.text,
        html: content.html,
        attachments: Array.isArray(notification.attachments)
          ? notification.attachments.map((attachment) => ({
              filename: attachment.filename,
              content: attachment.content,
              contentType: attachment.content_type,
              contentDisposition: attachment.disposition,
              cid: attachment.id,
            }))
          : undefined,
      })

      return { id: result.messageId }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger_.error(`[gmail-smtp] Failed to send email: ${message}`)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email through SMTP: ${message}`
      )
    }
  }
}

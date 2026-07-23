import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { GmailSmtpNotificationService } from "./service"

const provider = ModuleProvider(Modules.NOTIFICATION, {
  services: [GmailSmtpNotificationService],
})

export default provider
module.exports = provider

import { Module } from "@medusajs/framework/utils"
import PaymentSettingsService from "./service"

export const PAYMENT_SETTINGS_MODULE = "payment_settings"
export default Module(PAYMENT_SETTINGS_MODULE, { service: PaymentSettingsService })

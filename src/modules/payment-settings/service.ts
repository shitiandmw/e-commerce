import { MedusaService } from "@medusajs/framework/utils"
import { PaymentProviderSettings } from "./models/PaymentProviderSettings"

class PaymentSettingsService extends MedusaService({ PaymentProviderSettings }) {}
export default PaymentSettingsService

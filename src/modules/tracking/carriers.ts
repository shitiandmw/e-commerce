export interface CarrierDefinition {
  id: string
  name: string
  trackingUrlTemplate: string | null
}

export const CARRIERS: CarrierDefinition[] = [
  {
    id: "hongkong-post",
    name: "香港邮政 Hongkong Post",
    trackingUrlTemplate: "https://www.hongkongpost.hk/en/mail_tracking/index.html?tracknumber={number}",
  },
  {
    id: "sf-express",
    name: "顺丰速运 SF Express",
    trackingUrlTemplate: "https://www.sf-express.com/we/ow/chn/sc/waybill/waybill-detail/{number}",
  },
  {
    id: "dhl",
    name: "DHL",
    trackingUrlTemplate: "https://www.dhl.com/en/express/tracking.html?AWB={number}",
  },
  {
    id: "fedex",
    name: "FedEx",
    trackingUrlTemplate: "https://www.fedex.com/fedextrack/?trknbr={number}",
  },
  {
    id: "ups",
    name: "UPS",
    trackingUrlTemplate: "https://www.ups.com/track?tracknum={number}",
  },
  {
    id: "ems",
    name: "EMS 国际快递",
    trackingUrlTemplate: "https://www.ems.com.cn/queryResult?mailNo={number}",
  },
  {
    id: "other",
    name: "其他",
    trackingUrlTemplate: null,
  },
]

export function getCarrier(carrierId: string): CarrierDefinition | undefined {
  return CARRIERS.find((c) => c.id === carrierId)
}

export function buildTrackingUrl(carrierId: string, trackingNumber: string): string | null {
  const carrier = getCarrier(carrierId)
  if (!carrier?.trackingUrlTemplate) return null
  return carrier.trackingUrlTemplate.replace("{number}", encodeURIComponent(trackingNumber))
}

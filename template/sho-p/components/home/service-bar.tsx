import { ShieldCheck, Truck, Tag, MapPin } from "lucide-react"

const services = [
  {
    icon: ShieldCheck,
    title: "100% 正貨保證",
    description: "所有產品均由原廠授權渠道直接供貨",
  },
  {
    icon: Truck,
    title: "全球免費配送",
    description: "滿 HK$2,000 即享免運費服務",
  },
  {
    icon: Tag,
    title: "會員專屬優惠",
    description: "註冊會員享首單 9 折及積分回饋",
  },
  {
    icon: MapPin,
    title: "全程郵包追蹤",
    description: "實時追蹤您的包裹配送狀態",
  },
]

export function ServiceBar() {
  return (
    <section className="py-12 px-4 lg:px-6 border-y border-border/20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
            <div key={service.title} className="flex flex-col items-center text-center gap-3">
              <div className="flex size-12 items-center justify-center bg-gold/10 text-gold">
                <service.icon className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">{service.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

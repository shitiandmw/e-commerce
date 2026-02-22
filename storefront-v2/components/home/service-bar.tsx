import { ShieldCheck, Truck, Tag, MapPin } from "lucide-react"
import { getTranslations } from "next-intl/server"

export async function ServiceBar() {
  const t = await getTranslations()

  const services = [
    {
      icon: ShieldCheck,
      titleKey: "service_authentic_title" as const,
      descKey: "service_authentic_desc" as const,
    },
    {
      icon: Truck,
      titleKey: "service_shipping_title" as const,
      descKey: "service_shipping_desc" as const,
    },
    {
      icon: Tag,
      titleKey: "service_member_title" as const,
      descKey: "service_member_desc" as const,
    },
    {
      icon: MapPin,
      titleKey: "service_tracking_title" as const,
      descKey: "service_tracking_desc" as const,
    },
  ]

  return (
    <section className="py-12 px-4 lg:px-6 border-y border-border/20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
            <div key={service.titleKey} className="flex flex-col items-center text-center gap-3">
              <div className="flex size-12 items-center justify-center bg-gold/10 text-gold">
                <service.icon className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">{t(service.titleKey)}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t(service.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

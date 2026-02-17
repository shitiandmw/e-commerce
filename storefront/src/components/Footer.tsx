import Link from "next/link"
import { sdk } from "@/lib/medusa"
import { getDictionary, type Locale } from "@/lib/i18n"

type MenuItem = {
  id: string
  label: string
  url: string
  sort_order: number
  children: MenuItem[]
}

type Menu = {
  id: string
  name: string
  key: string
  items: MenuItem[]
}

async function getFooterMenu(locale: Locale): Promise<MenuItem[]> {
  try {
    const data = await sdk.client.fetch<{ menus: Menu[] }>(
      `/store/content/menus?key=footer&locale=${locale}`,
      { method: "GET" }
    )
    return data.menus?.[0]?.items || []
  } catch {
    return []
  }
}

export default async function Footer({ locale }: { locale: Locale }) {
  const [menuItems, dict] = await Promise.all([
    getFooterMenu(locale),
    getDictionary(locale),
  ])

  const mid = Math.ceil(menuItems.length / 2)
  const col1 = menuItems.slice(0, mid)
  const col2 = menuItems.slice(mid)

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold text-gold">TIMECIGAR</h3>
            <p className="text-sm text-muted">{dict.footer_tagline}</p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">{dict.shopping_guide}</h4>
            <ul className="space-y-2">
              {col1.map((item) => (
                <li key={item.id}>
                  <Link href={`/${locale}${item.url}`} className="text-sm text-muted hover:text-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">{dict.about}</h4>
            <ul className="space-y-2">
              {col2.map((item) => (
                <li key={item.id}>
                  <Link href={`/${locale}${item.url}`} className="text-sm text-muted hover:text-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">{dict.contact_us}</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a href="mailto:support@timecigar.com" className="hover:text-gold">
                  support@timecigar.com
                </a>
              </li>
              <li>
                <a href="tel:+8610-8888-8888" className="hover:text-gold">
                  010-8888-8888
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} TIMECIGAR. {dict.all_rights_reserved}
        </div>
      </div>
    </footer>
  )
}

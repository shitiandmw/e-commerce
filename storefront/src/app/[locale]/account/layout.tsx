import AccountSidebar from "@/components/AccountSidebar"
import { isValidLocale, type Locale } from "@/lib/i18n"

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const validLocale = isValidLocale(locale) ? locale : "zh-CN"

  return <AccountSidebar locale={validLocale as Locale}>{children}</AccountSidebar>
}

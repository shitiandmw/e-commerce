import AnnouncementBar from "@/components/AnnouncementBar"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { CartProvider } from "@/components/CartProvider"
import { CompareProvider } from "@/components/CompareProvider"
import CompareBar from "@/components/CompareBar"
import { isValidLocale, type Locale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  return (
    <CartProvider>
      <CompareProvider>
        <AnnouncementBar />
        <Header locale={locale as Locale} />
        <main className="min-h-screen">{children}</main>
        <Footer locale={locale as Locale} />
        <CompareBar />
      </CompareProvider>
    </CartProvider>
  )
}

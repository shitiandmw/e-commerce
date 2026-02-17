import Header from "@/components/Header"
import Footer from "@/components/Footer"
import AuthGuard from "@/components/AuthGuard"
import type { Locale } from "@/lib/i18n"

export default function MainLayout({ children, locale = "zh-CN" }: { children: React.ReactNode; locale?: Locale }) {
  return (
    <>
      <Header locale={locale} />
      <main className="min-h-screen">
        <AuthGuard>{children}</AuthGuard>
      </main>
      <Footer locale={locale} />
    </>
  )
}

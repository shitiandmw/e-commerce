import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Noto_Serif_SC, Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { LayoutShell } from '@/components/layout/layout-shell'
import { AnnouncementBarServer } from '@/components/layout/announcement-bar-server'
import { AgeVerification } from '@/components/age-verification'
import { getMainNav, getFooterMenu } from '@/lib/data/menu'
import { routing } from '@/i18n/routing'

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif-sc",
})

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

export const metadata: Metadata = {
  title: 'TimeCigar 雪茄時間 | 您的雪茄網購平台',
  description: '提供古巴雪茄、非古雪茄、迷你雪茄、雪茄品牌推薦及價格。高希霸、蒙特克里斯托、帕特加斯等頂級品牌。',
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound()
  }

  setRequestLocale(locale)

  const [navItems, footerMenu, messages] = await Promise.all([
    getMainNav(locale),
    getFooterMenu(locale),
    getMessages(),
  ])

  return (
    <html lang={locale} className={`${notoSerifSC.variable} ${geist.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>
          <AgeVerification />
          <AnnouncementBarServer locale={locale} />
          <LayoutShell navItems={navItems} footerMenu={footerMenu}>
            {children}
          </LayoutShell>
          <Toaster position="top-center" richColors />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}

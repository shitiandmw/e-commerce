import type { Metadata, Viewport } from 'next'
import { Noto_Serif_SC, Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { LayoutShell } from '@/components/layout/layout-shell'
import { AnnouncementBarServer } from '@/components/layout/announcement-bar-server'
import { AgeVerification } from '@/components/age-verification'
import { getMainNav } from '@/lib/data/menu'
import './globals.css'

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

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const navItems = await getMainNav()

  return (
    <html lang="zh-Hant" className={`${notoSerifSC.variable} ${geist.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <AgeVerification />
        <AnnouncementBarServer />
        <LayoutShell navItems={navItems}>{children}</LayoutShell>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}

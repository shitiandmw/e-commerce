import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import AnnouncementBar from "@/components/AnnouncementBar"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { CartProvider } from "@/components/CartProvider"
import { CompareProvider } from "@/components/CompareProvider"
import CompareBar from "@/components/CompareBar"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "TIMECIGAR - 精选雪茄",
    template: "%s - TIMECIGAR",
  },
  description: "精选雪茄，品味生活。TIMECIGAR 为您提供全球优质雪茄。",
  openGraph: {
    siteName: "TIMECIGAR",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CartProvider>
          <CompareProvider>
            <AnnouncementBar />
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <CompareBar />
          </CompareProvider>
        </CartProvider>
      </body>
    </html>
  )
}

"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { getToken } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { ChatSocketProvider } from "@/providers/chat-socket-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthed, setIsAuthed] = useState(false)
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace("/login")
    } else {
      setIsAuthed(true)
    }
  }, [router])

  useEffect(() => {
    setMobileNavigationOpen(false)
  }, [pathname])

  if (!isAuthed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ChatSocketProvider>
      <div className="relative flex h-screen overflow-hidden">
        <div className="hidden h-full shrink-0 md:block">
          <Sidebar />
        </div>

        {mobileNavigationOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileNavigationOpen(false)}
            />
            <div className="relative h-full w-64 shadow-xl">
              <Sidebar />
              <button
                type="button"
                title="Close navigation"
                aria-label="Close navigation"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileNavigationOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center border-b bg-card px-4 md:hidden">
            <button
              type="button"
              title="Open navigation"
              aria-label="Open navigation"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => setMobileNavigationOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </header>
          <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ChatSocketProvider>
  )
}

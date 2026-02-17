import Header from "@/components/Header"
import Footer from "@/components/Footer"
import AuthGuard from "@/components/AuthGuard"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <AuthGuard>{children}</AuthGuard>
      </main>
      <Footer />
    </>
  )
}

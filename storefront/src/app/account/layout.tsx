import Header from "@/components/Header"
import Footer from "@/components/Footer"
import AccountSidebar from "@/components/AccountSidebar"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <AccountSidebar>{children}</AccountSidebar>
      </main>
      <Footer />
    </>
  )
}

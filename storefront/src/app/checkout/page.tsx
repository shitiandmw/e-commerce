import AuthGuard from "@/components/AuthGuard"
import CheckoutClient from "./CheckoutClient"

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutClient />
    </AuthGuard>
  )
}

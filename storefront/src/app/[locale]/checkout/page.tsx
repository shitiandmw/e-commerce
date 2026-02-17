import type { Metadata } from "next"
import AuthGuard from "@/components/AuthGuard"
import CheckoutClient from "./CheckoutClient"

export const metadata: Metadata = {
  title: "结算",
  description: "完成您的订单",
}

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutClient />
    </AuthGuard>
  )
}

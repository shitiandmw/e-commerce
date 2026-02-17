import type { Metadata } from "next"
import CheckoutClient from "./CheckoutClient"

export const metadata: Metadata = {
  title: "结算",
  description: "完成您的订单",
}

export default function CheckoutPage() {
  return <CheckoutClient />
}

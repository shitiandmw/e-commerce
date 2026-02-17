import type { Metadata } from "next"
import CartPageClient from "./CartPageClient"

export const metadata: Metadata = {
  title: "购物车 - TIMECIGAR",
  description: "查看您的购物车",
}

export default function CartPage() {
  return <CartPageClient />
}

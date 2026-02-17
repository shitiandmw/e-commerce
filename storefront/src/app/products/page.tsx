import type { Metadata } from "next"
import ProductListClient from "./ProductListClient"

export const metadata: Metadata = {
  title: "全部商品 - TIMECIGAR",
  description: "浏览 TIMECIGAR 全部精选雪茄商品",
}

export default function ProductsPage() {
  return <ProductListClient />
}

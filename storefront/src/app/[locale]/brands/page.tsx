import type { Metadata } from "next"
import BrandListClient from "./BrandListClient"

export const metadata: Metadata = {
  title: "品牌 - TIMECIGAR",
  description: "浏览 TIMECIGAR 合作品牌",
}

export default function BrandsPage() {
  return <BrandListClient />
}

import type { Metadata } from "next"
import CompareClient from "./CompareClient"

export const metadata: Metadata = {
  title: "商品比较",
}

export default function ComparePage() {
  return <CompareClient />
}

"use client"

import { useParams } from "next/navigation"
import { PageDetail } from "@/components/pages/page-detail"

export default function PageDetailPage() {
  const params = useParams()
  const pageId = params.id as string

  return <PageDetail pageId={pageId} />
}

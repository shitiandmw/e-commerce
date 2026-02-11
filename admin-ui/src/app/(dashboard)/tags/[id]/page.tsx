"use client"

import { useParams } from "next/navigation"
import { TagDetail } from "@/components/tags/tag-detail"

export default function TagDetailPage() {
  const params = useParams()
  const tagId = params.id as string

  return <TagDetail tagId={tagId} />
}

"use client"

import { useParams } from "next/navigation"
import { CollectionDetail } from "@/components/collections/collection-detail"

export default function CollectionDetailPage() {
  const params = useParams()
  const collectionId = params.id as string

  return <CollectionDetail collectionId={collectionId} />
}

"use client"

import { useParams } from "next/navigation"
import { PopupDetail } from "@/components/popups/popup-detail"

export default function PopupDetailPage() {
  const params = useParams()
  const popupId = params.id as string

  return <PopupDetail popupId={popupId} />
}

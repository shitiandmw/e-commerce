"use client"

import { useTranslations } from "next-intl"
import { AnnouncementList } from "@/components/announcements/announcement-list"

export default function AnnouncementsPage() {
  const t = useTranslations("announcements")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AnnouncementList />
    </div>
  )
}

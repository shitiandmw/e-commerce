import { sdk } from "@/lib/medusa"
import type { Locale } from "@/lib/i18n"
import AnnouncementBarClient from "./AnnouncementBarClient"

type Announcement = {
  id: string
  text: string
  link_url: string | null
  sort_order: number
}

async function getAnnouncements(locale: Locale): Promise<Announcement[]> {
  try {
    const data = await sdk.client.fetch<{ announcements: Announcement[] }>(
      `/store/content/home?locale=${locale}`,
      { method: "GET" }
    )
    return data.announcements || []
  } catch {
    return []
  }
}

export default async function AnnouncementBar({ locale }: { locale: Locale }) {
  const announcements = await getAnnouncements(locale)
  if (announcements.length === 0) return null
  return <AnnouncementBarClient announcements={announcements} />
}

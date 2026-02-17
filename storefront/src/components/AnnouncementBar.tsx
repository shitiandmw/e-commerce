import { sdk } from "@/lib/medusa"
import AnnouncementBarClient from "./AnnouncementBarClient"

type Announcement = {
  id: string
  text: string
  link_url: string | null
  sort_order: number
}

async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const data = await sdk.client.fetch<{ announcements: Announcement[] }>(
      "/store/content/home",
      { method: "GET" }
    )
    return data.announcements || []
  } catch {
    return []
  }
}

export default async function AnnouncementBar() {
  const announcements = await getAnnouncements()
  if (announcements.length === 0) return null
  return <AnnouncementBarClient announcements={announcements} />
}

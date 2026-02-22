import { fetchContent } from "@/lib/medusa"
import { AnnouncementBarClient } from "./announcement-bar"

interface HomeContentResponse {
  announcements: {
    id: string
    text: string
    link_url?: string | null
    sort_order: number
  }[]
}

export async function AnnouncementBarServer({ locale }: { locale?: string }) {
  try {
    const data = await fetchContent<HomeContentResponse>("/store/content/home", undefined, locale)
    if (!data?.announcements?.length) return null
    return <AnnouncementBarClient announcements={data.announcements} />
  } catch {
    return null
  }
}

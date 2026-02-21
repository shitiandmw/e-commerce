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

export async function AnnouncementBarServer() {
  try {
    const data = await fetchContent<HomeContentResponse>("/store/content/home")
    if (!data?.announcements?.length) return null
    return <AnnouncementBarClient announcements={data.announcements} />
  } catch {
    return null
  }
}

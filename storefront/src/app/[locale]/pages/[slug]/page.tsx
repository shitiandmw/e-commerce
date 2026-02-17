import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { fetchContent } from "@/lib/api"

interface SeoData {
  meta_title?: string
  meta_description?: string
  og_image?: string
  keywords?: string
}

interface Page {
  id: string
  title: string
  slug: string
  content: string | null
  template: string | null
  seo?: SeoData | null
}

async function getPage(slug: string): Promise<Page | null> {
  try {
    const data = await fetchContent<{ page: Page }>(
      `/store/content/pages/${slug}`
    )
    return data.page
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return { title: "页面未找到" }

  const seo = page.seo
  // If seo.meta_title differs from page.title, it's user-customized
  const isCustomTitle = !!seo?.meta_title && seo.meta_title !== page.title
  const displayTitle = isCustomTitle ? seo!.meta_title! : (page.title || "")
  const description = seo?.meta_description || `${page.title} - TIMECIGAR`
  const ogImage = seo?.og_image || undefined

  return {
    title: isCustomTitle ? { absolute: displayTitle } : displayTitle,
    description,
    keywords: seo?.keywords || undefined,
    openGraph: {
      title: isCustomTitle ? displayTitle : `${displayTitle} - TIMECIGAR`,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  }
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()

  const isFaqTemplate = page.template === "faq"

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <Link
          href={`/${locale}`}
          className="text-sm text-muted hover:text-gold transition-colors"
        >
          ← 返回首页
        </Link>
      </div>

      <h1 className="mb-8 text-3xl font-bold text-foreground">{page.title}</h1>

      {page.content && (
        <div
          className={`prose-content ${isFaqTemplate ? "faq-layout" : ""}`}
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      )}
    </div>
  )
}

import { notFound } from "next/navigation"
import Link from "next/link"
import { fetchContent } from "@/lib/api"

interface Page {
  id: string
  title: string
  slug: string
  content: string | null
  template: string | null
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let page: Page
  try {
    const data = await fetchContent<{ page: Page }>(
      `/store/content/pages/${slug}`
    )
    page = data.page
  } catch {
    notFound()
  }

  const isFaqTemplate = page.template === "faq"

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/"
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

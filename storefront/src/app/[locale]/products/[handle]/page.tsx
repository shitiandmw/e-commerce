import ProductDetailClient from "./ProductDetailClient"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

interface Props {
  params: Promise<{ handle: string }>
}

async function getProduct(handle: string) {
  const fields = "id,title,handle,subtitle,description,thumbnail,images.*,options.*,options.values.*,variants.*,variants.options.*,variants.prices.*,variants.inventory_quantity,*brand,tags.*,metadata"
  const url = `${MEDUSA_BACKEND_URL}/store/products?handle=${encodeURIComponent(handle)}&fields=${encodeURIComponent(fields)}&limit=1`
  try {
    const res = await fetch(url, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_KEY,
        "content-type": "application/json",
      },
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.products?.[0] || null
  } catch {
    return null
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { handle } = await params
  const product = await getProduct(handle)
  return <ProductDetailClient product={product} handle={handle} />
}

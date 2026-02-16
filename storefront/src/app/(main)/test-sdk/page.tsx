import { sdk } from "@/lib/medusa"
import ClientSDKTest from "./client-test"

async function getProducts() {
  try {
    const { products, count } = await sdk.store.product.list({ limit: 5 })
    return { products, count, error: null }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { products: [], count: 0, error: message }
  }
}

export default async function TestSDKPage() {
  const serverResult = await getProducts()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-gold">SDK 连通性测试</h1>

      <section className="mb-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          服务端测试 (Server Component)
        </h2>
        {serverResult.error ? (
          <p className="text-red-400">错误: {serverResult.error}</p>
        ) : (
          <div>
            <p className="mb-2 text-muted">
              共找到 <span className="text-gold">{serverResult.count}</span> 个商品
            </p>
            {serverResult.products.length > 0 ? (
              <ul className="space-y-2">
                {serverResult.products.map((p: { id: string; title: string }) => (
                  <li key={p.id} className="text-sm text-foreground">
                    • {p.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">暂无商品数据</p>
            )}
          </div>
        )}
      </section>

      <ClientSDKTest />
    </div>
  )
}

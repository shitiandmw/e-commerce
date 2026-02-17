import MainLayout from "@/components/MainLayout"

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center px-4 py-24">
        <h1 className="mb-4 text-4xl font-bold tracking-wider text-gold">
          TIMECIGAR
        </h1>
        <p className="mb-8 max-w-md text-center text-lg text-muted">
          精选雪茄，品味生活。探索来自全球的优质雪茄。
        </p>
        <a
          href="/products"
          className="rounded-md bg-gold px-8 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light"
        >
          浏览商品
        </a>
      </div>
    </MainLayout>
  )
}

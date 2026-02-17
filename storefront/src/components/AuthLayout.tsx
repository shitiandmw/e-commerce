import Link from "next/link"

export default function AuthLayout({ children, locale = "zh-CN" }: { children: React.ReactNode; locale?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href={`/${locale}`} className="mb-8 text-2xl font-bold tracking-wider text-gold">
        TIMECIGAR
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

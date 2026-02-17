"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { requestPasswordReset } from "@/lib/auth"
import AuthLayout from "@/components/AuthLayout"

export default function ForgotPasswordPage() {
  const { locale } = useParams()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email) { setError("请输入邮箱"); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("邮箱格式不正确"); return
    }
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  const inp = "w-full rounded border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none"

  if (submitted) {
    return (
      <AuthLayout>
        <div className="rounded-lg border border-border bg-surface p-8">
          <h1 className="mb-4 text-center text-2xl font-bold text-foreground">邮件已发送</h1>
          <p className="mb-6 text-center text-sm text-muted">
            如果该邮箱已注册，您将收到一封密码重置邮件。请检查您的收件箱。
          </p>
          <Link href={`/${locale}/login`}
            className="block w-full rounded bg-gold py-2 text-center font-medium text-background transition-colors hover:bg-gold-light">
            返回登录
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="rounded-lg border border-border bg-surface p-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-foreground">忘记密码</h1>
        <p className="mb-6 text-center text-sm text-muted">输入您的注册邮箱，我们将发送密码重置链接。</p>
        {error && (
          <div className="mb-4 rounded bg-red-500/10 px-4 py-2 text-sm text-red-500">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-muted">邮箱</label>
            <input id="email" type="email" placeholder="your@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inp} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded bg-gold py-2 font-medium text-background transition-colors hover:bg-gold-light disabled:opacity-50">
            {loading ? "发送中..." : "发送重置链接"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          <Link href={`/${locale}/login`} className="text-gold hover:text-gold-light">返回登录</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
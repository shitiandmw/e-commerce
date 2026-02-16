"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { login, isLoggedIn } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isLoggedIn()) router.replace(redirect)
  }, [router, redirect])

  function validate() {
    const errs: Record<string, string> = {}
    if (!email) errs.email = "请输入邮箱"
    if (!password) errs.password = "请输入密码"
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      await login(email, password)
      router.push(redirect)
    } catch {
      setServerError("邮箱或密码错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-foreground">
        登录
      </h1>
      {serverError && (
        <div className="mb-4 rounded bg-red-500/10 px-4 py-2 text-sm text-red-500">
          {serverError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-muted">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-muted">
            密码
          </label>
          <input
            id="password"
            type="password"
            placeholder="输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </div>
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-gold hover:text-gold-light"
          >
            忘记密码？
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-gold py-2 font-medium text-background transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        还没有账户？{" "}
        <Link href="/register" className="text-gold hover:text-gold-light">
          立即注册
        </Link>
      </p>
    </div>
  )
}

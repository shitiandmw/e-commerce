"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { register } from "@/lib/auth"
import AuthLayout from "@/components/AuthLayout"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.email) errs.email = "请输入邮箱"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "邮箱格式不正确"
    if (!form.password) errs.password = "请输入密码"
    else if (form.password.length < 8) errs.password = "密码至少8位"
    if (!form.confirmPassword) errs.confirmPassword = "请确认密码"
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "两次密码不一致"
    if (!form.firstName) errs.firstName = "请输入名"
    if (!form.lastName) errs.lastName = "请输入姓"
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
      await register({
        email: form.email,
        password: form.password,
        first_name: form.firstName,
        last_name: form.lastName,
      })
      router.push("/")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "注册失败"
      if (msg.includes("exists") || msg.includes("already"))
        setServerError("该邮箱已被注册")
      else setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inp = "w-full rounded border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none"

  return (
    <AuthLayout>
      <div className="rounded-lg border border-border bg-surface p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">创建账户</h1>
        {serverError && (
          <div className="mb-4 rounded bg-red-500/10 px-4 py-2 text-sm text-red-500">{serverError}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm text-muted">姓</label>
              <input id="lastName" type="text" placeholder="张" value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inp} />
              {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
            </div>
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm text-muted">名</label>
              <input id="firstName" type="text" placeholder="三" value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inp} />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-muted">邮箱</label>
            <input id="email" type="email" placeholder="your@email.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-muted">密码</label>
            <input id="password" type="password" placeholder="至少8位" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} className={inp} />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm text-muted">确认密码</label>
            <input id="confirmPassword" type="password" placeholder="再次输入密码" value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={inp} />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded bg-gold py-2 font-medium text-background transition-colors hover:bg-gold-light disabled:opacity-50">
            {loading ? "注册中..." : "注册"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          已有账户？{" "}
          <Link href="/login" className="text-gold hover:text-gold-light">立即登录</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { register } from "@/lib/auth"

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
    else if (form.password.length < 8)
      errs.password = "密码至少8位"
    if (!form.confirmPassword) errs.confirmPassword = "请确认密码"
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "两次密码不一致"
    if (!form.firstName) errs.firstName = "请输入姓"
    if (!form.lastName) errs.lastName = "请输入名"
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

  function field(
    name: keyof typeof form,
    label: string,
    type = "text",
    placeholder = ""
  ) {
    return (
      <div>
        <label htmlFor={name} className="mb-1 block text-sm text-muted">
          {label}
        </label>
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none"
        />
        {errors[name] && (
          <p className="mt-1 text-sm text-red-500">{errors[name]}</p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-foreground">
        创建账户
      </h1>
      {serverError && (
        <div className="mb-4 rounded bg-red-500/10 px-4 py-2 text-sm text-red-500">
          {serverError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field("lastName", "姓", "text", "张")}
          {field("firstName", "名", "text", "三")}
        </div>
        {field("email", "邮箱", "email", "your@email.com")}
        {field("password", "密码", "password", "至少8位")}
        {field("confirmPassword", "确认密码", "password", "再次输入密码")}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-gold py-2 font-medium text-background transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {loading ? "注册中..." : "注册"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        已有账户？{" "}
        <Link href="/login" className="text-gold hover:text-gold-light">
          立即登录
        </Link>
      </p>
    </div>
  )
}

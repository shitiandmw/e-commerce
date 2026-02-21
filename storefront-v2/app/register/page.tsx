"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { register } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

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
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">创建账户</CardTitle>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="mb-4 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">姓</Label>
                <Input id="lastName" placeholder="张" value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)} />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">名</Label>
                <Input id="firstName" placeholder="三" value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)} />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={form.email}
                onChange={(e) => update("email", e.target.value)} />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" placeholder="至少8位" value={form.password}
                onChange={(e) => update("password", e.target.value)} />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input id="confirmPassword" type="password" placeholder="再次输入密码"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)} />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gold text-background hover:bg-gold/90">
              {loading ? "注册中..." : "注册"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            已有账户？{" "}
            <Link href="/login" className="text-gold hover:text-gold/80">
              立即登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

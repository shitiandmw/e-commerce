"use client"

import { useState, useEffect } from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { login, isLoggedIn } from "@/lib/auth"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const t = useTranslations()
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
    if (!email) errs.email = t("validation_email_required")
    if (!password) errs.password = t("validation_password_required")
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
      setServerError(t("login_failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("login")}</CardTitle>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="mb-4 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("placeholder_enter_password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-gold hover:text-gold/80">
                {t("forgot_password")}
              </Link>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gold text-background hover:bg-gold/90">
              {loading ? t("loading") : t("login")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("no_account")}{" "}
            <Link href="/register" className="text-gold hover:text-gold/80">
              {t("register_now")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

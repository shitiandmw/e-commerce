"use client"

import { useState } from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { register } from "@/lib/auth"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  const t = useTranslations()
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
    if (!form.email) errs.email = t("validation_email_required")
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = t("validation_email_invalid")
    if (!form.password) errs.password = t("validation_password_required")
    else if (form.password.length < 8) errs.password = t("validation_password_min")
    if (!form.confirmPassword) errs.confirmPassword = t("validation_confirm_required")
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = t("validation_confirm_mismatch")
    if (!form.firstName) errs.firstName = t("validation_first_name_required")
    if (!form.lastName) errs.lastName = t("validation_last_name_required")
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
      const code = err instanceof Error ? err.message : ""
      if (code === "EMAIL_EXISTS") {
        setServerError(t("email_already_registered"))
      } else {
        setServerError(t("register_failed"))
      }
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
          <CardTitle className="text-2xl">{t("register")}</CardTitle>
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
                <Label htmlFor="lastName">{t("last_name")}</Label>
                <Input id="lastName" placeholder={t("placeholder_last_name")} value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)} />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("first_name")}</Label>
                <Input id="firstName" placeholder={t("placeholder_first_name")} value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)} />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={form.email}
                onChange={(e) => update("email", e.target.value)} />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" placeholder={t("placeholder_password_min")} value={form.password}
                onChange={(e) => update("password", e.target.value)} />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirm_password")}</Label>
              <Input id="confirmPassword" type="password" placeholder={t("placeholder_confirm_password")}
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)} />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gold text-background hover:bg-gold/90">
              {loading ? t("loading") : t("register")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("has_account")}{" "}
            <Link href="/login" className="text-gold hover:text-gold/80">
              {t("login_now")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

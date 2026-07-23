"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { resetPassword } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""
  const hasValidLink = Boolean(token && email)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function validate() {
    const nextErrors: Record<string, string> = {}
    if (!password) nextErrors.password = t("validation_password_required")
    else if (password.length < 8) nextErrors.password = t("validation_password_min")
    if (!confirmPassword) nextErrors.confirmPassword = t("validation_confirm_required")
    else if (password !== confirmPassword) {
      nextErrors.confirmPassword = t("validation_confirm_mismatch")
    }
    return nextErrors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasValidLink) return

    setServerError("")
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      await resetPassword(email, password, token)
      setSubmitted(true)
    } catch {
      setServerError(t("reset_password_failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("reset_password_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasValidLink ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-destructive">
                {t("reset_password_invalid_link")}
              </p>
              <Link href="/forgot-password" className="text-sm text-gold hover:text-gold/80">
                {t("send_reset_link")}
              </Link>
            </div>
          ) : submitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t("reset_password_success")}
              </p>
              <Link href="/login" className="text-sm text-gold hover:text-gold/80">
                {t("back_to_login")}
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {t("reset_password_desc")}
              </p>
              {serverError && (
                <div className="mb-4 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {serverError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("placeholder_password_min")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("confirm_password")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("placeholder_confirm_password")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold text-background hover:bg-gold/90"
                >
                  {loading ? t("loading") : t("reset_password_submit")}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

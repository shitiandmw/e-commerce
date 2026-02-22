"use client"

import { useEffect, useState, useCallback } from "react"
import { getCustomer, getToken } from "@/lib/auth"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const t = useTranslations()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    const c = await getCustomer()
    if (c) {
      setFirstName(c.first_name || "")
      setLastName(c.last_name || "")
      setPhone(c.phone || "")
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ type: "error", text: t("name_required") })
      return
    }
    setSaving(true)
    try {
      const token = getToken()
      const res = await fetch("/api/account/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() || undefined }),
      })
      if (!res.ok) throw new Error()
      setMessage({ type: "success", text: t("profile_updated") })
    } catch {
      setMessage({ type: "error", text: t("update_failed") })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("profile_title")}</h1>
      {message && (
        <div className={`rounded-md px-4 py-3 text-sm ${message.type === "success" ? "bg-green-900/30 text-green-400" : "bg-destructive/10 text-destructive"}`}>
          {message.text}
        </div>
      )}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">{t("edit_profile")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("last_name")}</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("enter_last_name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("first_name")}</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("enter_first_name")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("enter_phone")} />
            </div>
            <Button type="submit" disabled={saving} className="bg-gold text-background hover:bg-gold/90">
              {saving ? t("saving") : t("save_changes")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

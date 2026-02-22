"use client"

import { useEffect, useState, useCallback } from "react"
import { getToken } from "@/lib/auth"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Address {
  id: string
  first_name: string
  last_name: string
  phone: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
  is_default_shipping?: boolean
}

const EMPTY = {
  first_name: "", last_name: "", phone: "", address_1: "", address_2: "",
  city: "", province: "", postal_code: "", country_code: "cn",
}

export default function AddressesPage() {
  const t = useTranslations()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const getHeaders = () => {
    const token = getToken()
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` } as Record<string, string>
  }

  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/account/addresses", { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.addresses || [])
      }
    } catch { /* empty */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadAddresses() }, [loadAddresses])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY)
    setMessage(null)
    setDialogOpen(true)
  }

  const openEdit = (addr: Address) => {
    setEditingId(addr.id)
    setForm({
      first_name: addr.first_name, last_name: addr.last_name, phone: addr.phone || "",
      address_1: addr.address_1, address_2: addr.address_2 || "", city: addr.city,
      province: addr.province || "", postal_code: addr.postal_code, country_code: addr.country_code || "cn",
    })
    setMessage(null)
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim() || !form.address_1.trim() || !form.city.trim()) {
      setMessage({ type: "error", text: t("required_fields_error") })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        phone: form.phone.trim() || undefined, address_1: form.address_1.trim(),
        address_2: form.address_2?.trim() || undefined, city: form.city.trim(),
        province: form.province?.trim() || undefined, postal_code: form.postal_code.trim(),
        country_code: form.country_code || "cn",
      }
      const url = editingId ? `/api/account/addresses/${editingId}` : "/api/account/addresses"
      const res = await fetch(url, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      await loadAddresses()
      setDialogOpen(false)
    } catch {
      setMessage({ type: "error", text: t("save_failed") })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/account/addresses/${deleteId}`, { method: "DELETE", headers: getHeaders() })
      await loadAddresses()
    } catch { /* empty */ }
    setDeleteId(null)
  }

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`/api/account/addresses/${id}`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify({ is_default_shipping: true }),
      })
      await loadAddresses()
    } catch { /* empty */ }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("addresses_title")}</h1>
        <Button onClick={openCreate} className="bg-gold text-background hover:bg-gold/90">{t("add_new_address")}</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : addresses.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t("no_addresses")}</p>
            <button onClick={openCreate} className="mt-3 text-sm text-gold hover:text-gold/80">{t("add_first_address")}</button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <Card key={addr.id} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <p className="font-medium text-foreground">{addr.last_name} {addr.first_name}</p>
                  {addr.is_default_shipping && <Badge variant="outline" className="border-gold/30 text-gold">{t("default_label")}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{addr.address_1}{addr.address_2 ? `, ${addr.address_2}` : ""}</p>
                <p className="text-sm text-muted-foreground">{addr.city}{addr.province ? `, ${addr.province}` : ""} {addr.postal_code}</p>
                {addr.phone && <p className="text-sm text-muted-foreground">{addr.phone}</p>}
                <div className="mt-3 flex gap-3 text-xs">
                  <button onClick={() => openEdit(addr)} className="text-gold hover:text-gold/80">{t("edit")}</button>
                  {!addr.is_default_shipping && <button onClick={() => handleSetDefault(addr.id)} className="text-muted-foreground hover:text-foreground">{t("set_as_default")}</button>}
                  <button onClick={() => setDeleteId(addr.id)} className="text-red-400 hover:text-red-300">{t("delete")}</button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t("edit_address") : t("new_address")}</DialogTitle>
          </DialogHeader>
          {message && (
            <div className={`rounded-md px-4 py-3 text-sm ${message.type === "error" ? "bg-destructive/10 text-destructive" : "bg-green-900/30 text-green-400"}`}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("last_name")} *</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("first_name")} *</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("phone")}</Label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("country_code_label")}</Label>
                <Input value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("address")} *</Label>
                <Input value={form.address_1} onChange={(e) => setForm({ ...form, address_1: e.target.value })} placeholder={t("street_address")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("address_line_2")}</Label>
                <Input value={form.address_2 || ""} onChange={(e) => setForm({ ...form, address_2: e.target.value })} placeholder={t("address_line_2_placeholder")} />
              </div>
              <div className="space-y-2">
                <Label>{t("city")} *</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("province")}</Label>
                <Input value={form.province || ""} onChange={(e) => setForm({ ...form, province: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("postal_code")}</Label>
                <Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t("cancel")}</Button>
              <Button type="submit" disabled={saving} className="bg-gold text-background hover:bg-gold/90">
                {saving ? t("saving") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirm_delete_address")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

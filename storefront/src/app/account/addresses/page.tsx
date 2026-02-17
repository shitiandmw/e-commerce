"use client"

import { useEffect, useState, useCallback } from "react"
import { getToken } from "@/lib/auth"

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

const EMPTY: Omit<Address, "id" | "is_default_shipping"> = {
  first_name: "", last_name: "", phone: "", address_1: "", address_2: "",
  city: "", province: "", postal_code: "", country_code: "cn",
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Address | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const getHeaders = () => {
    const token = getToken()
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
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

  const openCreate = () => { setEditing(null); setForm(EMPTY); setCreating(true); setMessage(null) }
  const openEdit = (addr: Address) => {
    setCreating(false); setEditing(addr)
    setForm({ first_name: addr.first_name, last_name: addr.last_name, phone: addr.phone || "",
      address_1: addr.address_1, address_2: addr.address_2 || "", city: addr.city,
      province: addr.province || "", postal_code: addr.postal_code, country_code: addr.country_code || "cn" })
    setMessage(null)
  }
  const closeForm = () => { setCreating(false); setEditing(null); setMessage(null) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim() || !form.address_1.trim() || !form.city.trim()) {
      setMessage({ type: "error", text: "请填写必填字段（姓名、地址、城市）" }); return
    }
    setSaving(true); setMessage(null)
    try {
      const payload = {
        first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        phone: form.phone.trim() || undefined, address_1: form.address_1.trim(),
        address_2: form.address_2?.trim() || undefined, city: form.city.trim(),
        province: form.province?.trim() || undefined, postal_code: form.postal_code.trim(),
        country_code: form.country_code || "cn",
      }
      const url = editing ? `/api/account/addresses/${editing.id}` : "/api/account/addresses"
      const res = await fetch(url, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      await loadAddresses(); closeForm()
    } catch { setMessage({ type: "error", text: "保存失败，请重试" }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此地址？")) return
    try {
      await fetch(`/api/account/addresses/${id}`, { method: "DELETE", headers: getHeaders() })
      await loadAddresses()
    } catch { setMessage({ type: "error", text: "删除失败" }) }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`/api/account/addresses/${id}`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify({ is_default_shipping: true }),
      })
      await loadAddresses()
    } catch { setMessage({ type: "error", text: "设置默认地址失败" }) }
  }

  const showForm = creating || editing
  const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">收货地址</h1>
        {!showForm && (
          <button onClick={openCreate} className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-background hover:bg-gold-light">新增地址</button>
        )}
      </div>
      {message && (
        <div className={`mb-4 rounded-md px-4 py-3 text-sm ${message.type === "success" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>{message.text}</div>
      )}
      {showForm ? (
        <form onSubmit={handleSave} className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">{editing ? "编辑地址" : "新增地址"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm text-muted">姓 *</label><input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} /></div>
            <div><label className="mb-1 block text-sm text-muted">名 *</label><input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} /></div>
            <div><label className="mb-1 block text-sm text-muted">电话</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></div>
            <div><label className="mb-1 block text-sm text-muted">国家代码</label><input type="text" value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} className={inputCls} /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-sm text-muted">地址 *</label><input type="text" value={form.address_1} onChange={(e) => setForm({ ...form, address_1: e.target.value })} className={inputCls} placeholder="街道地址" /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-sm text-muted">地址补充</label><input type="text" value={form.address_2 || ""} onChange={(e) => setForm({ ...form, address_2: e.target.value })} className={inputCls} placeholder="公寓、楼层等（可选）" /></div>
            <div><label className="mb-1 block text-sm text-muted">城市 *</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} /></div>
            <div><label className="mb-1 block text-sm text-muted">省份</label><input type="text" value={form.province || ""} onChange={(e) => setForm({ ...form, province: e.target.value })} className={inputCls} /></div>
            <div><label className="mb-1 block text-sm text-muted">邮编</label><input type="text" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className={inputCls} /></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={saving} className="rounded-md bg-gold px-6 py-2 text-sm font-medium text-background hover:bg-gold-light disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
            <button type="button" onClick={closeForm} className="rounded-md border border-border px-6 py-2 text-sm text-muted hover:text-foreground">取消</button>
          </div>
        </form>
      ) : loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded bg-surface-light" />)}</div>
      ) : addresses.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface py-12 text-center">
          <p className="text-muted">暂无收货地址</p>
          <button onClick={openCreate} className="mt-3 text-sm text-gold hover:text-gold-light">添加第一个地址</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-2 flex items-start justify-between">
                <p className="font-medium text-foreground">{addr.last_name} {addr.first_name}</p>
                {addr.is_default_shipping && <span className="rounded bg-gold/20 px-2 py-0.5 text-xs text-gold">默认</span>}
              </div>
              <p className="text-sm text-muted">{addr.address_1}{addr.address_2 ? `, ${addr.address_2}` : ""}</p>
              <p className="text-sm text-muted">{addr.city}{addr.province ? `, ${addr.province}` : ""} {addr.postal_code}</p>
              {addr.phone && <p className="text-sm text-muted">{addr.phone}</p>}
              <div className="mt-3 flex gap-3 text-xs">
                <button onClick={() => openEdit(addr)} className="text-gold hover:text-gold-light">编辑</button>
                {!addr.is_default_shipping && <button onClick={() => handleSetDefault(addr.id)} className="text-muted hover:text-foreground">设为默认</button>}
                <button onClick={() => handleDelete(addr.id)} className="text-red-400 hover:text-red-300">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

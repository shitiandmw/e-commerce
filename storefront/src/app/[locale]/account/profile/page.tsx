"use client"

import { useEffect, useState, useCallback } from "react"
import { getCustomer, getToken } from "@/lib/auth"

export default function ProfilePage() {
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
      setMessage({ type: "error", text: "姓名不能为空" })
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
      setMessage({ type: "success", text: "资料更新成功" })
    } catch {
      setMessage({ type: "error", text: "更新失败，请重试" })
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">个人资料</h1>
      {message && (
        <div className={`mb-4 rounded-md px-4 py-3 text-sm ${message.type === "success" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
          {message.text}
        </div>
      )}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded bg-surface-light" />)}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted">姓</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} placeholder="请输入姓" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">名</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="请输入名" />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm text-muted">电话</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="请输入电话号码" />
          </div>
          <button type="submit" disabled={saving} className="mt-6 rounded-md bg-gold px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-gold-light disabled:opacity-50">
            {saving ? "保存中..." : "保存修改"}
          </button>
        </form>
      )}
    </div>
  )
}

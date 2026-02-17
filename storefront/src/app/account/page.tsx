"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { getCustomer, getToken } from "@/lib/auth"

interface Order {
  id: string
  display_id: number
  created_at: string
  status: string
  total: number
  currency_code: string
}

export default function AccountPage() {
  const [customer, setCustomer] = useState<Record<string, string> | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  const loadData = useCallback(async () => {
    const c = await getCustomer()
    setCustomer(c)
    const token = getToken()
    if (token) {
      try {
        const res = await fetch("/api/account/orders?limit=3&offset=0", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setOrders(data.orders || [])
        }
      } catch { /* no orders yet */ }
    }
    setLoadingOrders(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN")
  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("zh-CN", { style: "currency", currency: currency || "USD" }).format(amount)

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: "待处理", completed: "已完成", canceled: "已取消",
      requires_action: "待操作", archived: "已归档",
    }
    return map[s] || s
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">账户概览</h1>

      <div className="mb-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">个人信息</h2>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted">姓名</span>
            <p className="text-foreground">{customer?.last_name}{customer?.first_name}</p>
          </div>
          <div>
            <span className="text-muted">邮箱</span>
            <p className="text-foreground">{customer?.email}</p>
          </div>
          {customer?.phone && (
            <div>
              <span className="text-muted">电话</span>
              <p className="text-foreground">{customer?.phone}</p>
            </div>
          )}
        </div>
        <Link href="/account/profile" className="mt-4 inline-block text-sm text-gold hover:text-gold-light">
          编辑资料 →
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">最近订单</h2>
          <Link href="/account/orders" className="text-sm text-gold hover:text-gold-light">
            查看全部 →
          </Link>
        </div>
        {loadingOrders ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-surface-light" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">暂无订单</p>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">订单 #{order.display_id}</p>
                  <p className="text-xs text-muted">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground">{formatPrice(order.total, order.currency_code)}</p>
                  <p className="text-xs text-muted">{statusLabel(order.status)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

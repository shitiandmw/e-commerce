"use client"

import { useEffect, useState, useCallback } from "react"
import { getToken } from "@/lib/auth"

interface OrderItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  thumbnail?: string
}

interface Order {
  id: string
  display_id: number
  created_at: string
  status: string
  total: number
  currency_code: string
  items: OrderItem[]
  shipping_address?: {
    first_name: string; last_name: string; address_1: string
    city: string; province?: string; postal_code: string
  }
  payment_status?: string
  fulfillment_status?: string
}

const PAGE_SIZE = 10

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [detail, setDetail] = useState<Order | null>(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      const fields = encodeURIComponent("+items,+items.thumbnail,+shipping_address")
      const res = await fetch(
        `/api/account/orders?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}&fields=${fields}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
        setTotal(data.count || 0)
      }
    } catch { /* empty */ }
    setLoading(false)
  }, [page])

  useEffect(() => { loadOrders() }, [loadOrders])

  const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("zh-CN", { style: "currency", currency: currency || "USD" }).format(amount)
  const statusLabel = (s: string) => ({ pending: "待处理", completed: "已完成", canceled: "已取消", requires_action: "待操作", archived: "已归档" }[s] || s)
  const paymentLabel = (s?: string) => s ? ({ not_paid: "未支付", awaiting: "待支付", captured: "已支付", refunded: "已退款", partially_refunded: "部分退款", canceled: "已取消" }[s] || s) : "-"
  const fulfillmentLabel = (s?: string) => s ? ({ not_fulfilled: "未发货", fulfilled: "已发货", partially_fulfilled: "部分发货", shipped: "已发货", delivered: "已送达", returned: "已退货", canceled: "已取消" }[s] || s) : "-"
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (detail) {
    return (
      <div>
        <button onClick={() => setDetail(null)} className="mb-4 text-sm text-gold hover:text-gold-light">← 返回订单列表</button>
        <h1 className="mb-6 text-2xl font-bold text-foreground">订单 #{detail.display_id}</h1>
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">订单信息</h2>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-muted">日期：</span>{formatDate(detail.created_at)}</div>
              <div><span className="text-muted">状态：</span>{statusLabel(detail.status)}</div>
              <div><span className="text-muted">支付：</span>{paymentLabel(detail.payment_status)}</div>
              <div><span className="text-muted">物流：</span>{fulfillmentLabel(detail.fulfillment_status)}</div>
              <div><span className="text-muted">总计：</span>{formatPrice(detail.total, detail.currency_code)}</div>
            </div>
          </div>
          {detail.items?.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">商品列表</h2>
              <div className="divide-y divide-border">
                {detail.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3">
                    {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="h-12 w-12 rounded object-cover" />}
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted">x{item.quantity}</p>
                    </div>
                    <p className="text-sm text-foreground">{formatPrice(item.unit_price * item.quantity, detail.currency_code)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {detail.shipping_address && (
            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">收货地址</h2>
              <p className="text-sm text-foreground">{detail.shipping_address.last_name} {detail.shipping_address.first_name}</p>
              <p className="text-sm text-muted">{detail.shipping_address.address_1}</p>
              <p className="text-sm text-muted">{detail.shipping_address.city}{detail.shipping_address.province ? `, ${detail.shipping_address.province}` : ""} {detail.shipping_address.postal_code}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">订单历史</h1>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded bg-surface-light" />)}</div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface py-16 text-center">
          <p className="text-lg text-muted">暂无订单</p>
          <p className="mt-2 text-sm text-muted">您还没有任何订单记录</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-3 font-medium">订单号</th>
                <th className="px-4 py-3 font-medium">日期</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium text-right">金额</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-light">
                    <td className="px-4 py-3 text-foreground">#{order.display_id}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-muted">{statusLabel(order.status)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{formatPrice(order.total, order.currency_code)}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => setDetail(order)} className="text-gold hover:text-gold-light">查看详情</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded border border-border px-3 py-1 text-sm text-muted hover:text-foreground disabled:opacity-30">上一页</button>
              <span className="text-sm text-muted">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded border border-border px-3 py-1 text-sm text-muted hover:text-foreground disabled:opacity-30">下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

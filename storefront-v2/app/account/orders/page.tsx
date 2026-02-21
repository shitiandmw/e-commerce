"use client"

import { useEffect, useState, useCallback } from "react"
import { getToken } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

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

const statusLabel = (s: string) =>
  ({ pending: "待处理", completed: "已完成", canceled: "已取消", requires_action: "待操作", archived: "已归档" }[s] || s)
const paymentLabel = (s?: string) =>
  s ? ({ not_paid: "未支付", awaiting: "待支付", captured: "已支付", refunded: "已退款", partially_refunded: "部分退款", canceled: "已取消" }[s] || s) : "-"
const fulfillmentLabel = (s?: string) =>
  s ? ({ not_fulfilled: "未发货", fulfilled: "已发货", partially_fulfilled: "部分发货", shipped: "已发货", delivered: "已送达", returned: "已退货", canceled: "已取消" }[s] || s) : "-"

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
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (detail) {
    return (
      <div className="space-y-6">
        <button onClick={() => setDetail(null)} className="text-sm text-gold hover:text-gold/80">← 返回订单列表</button>
        <h1 className="text-2xl font-bold text-foreground">订单 #{detail.display_id}</h1>

        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-lg">订单信息</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-muted-foreground">日期：</span>{formatDate(detail.created_at)}</div>
              <div><span className="text-muted-foreground">状态：</span><Badge variant="outline">{statusLabel(detail.status)}</Badge></div>
              <div><span className="text-muted-foreground">支付：</span>{paymentLabel(detail.payment_status)}</div>
              <div><span className="text-muted-foreground">物流：</span>{fulfillmentLabel(detail.fulfillment_status)}</div>
              <div><span className="text-muted-foreground">总计：</span>{formatPrice(detail.total, detail.currency_code)}</div>
            </div>
          </CardContent>
        </Card>

        {detail.items?.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-lg">商品列表</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {detail.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3">
                    {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="h-12 w-12 rounded object-cover" />}
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <p className="text-sm text-foreground">{formatPrice(item.unit_price * item.quantity, detail.currency_code)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {detail.shipping_address && (
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-lg">收货地址</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{detail.shipping_address.last_name} {detail.shipping_address.first_name}</p>
              <p className="text-sm text-muted-foreground">{detail.shipping_address.address_1}</p>
              <p className="text-sm text-muted-foreground">{detail.shipping_address.city}{detail.shipping_address.province ? `, ${detail.shipping_address.province}` : ""} {detail.shipping_address.postal_code}</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">订单历史</h1>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : orders.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-16 text-center">
            <p className="text-lg text-muted-foreground">暂无订单</p>
            <p className="mt-2 text-sm text-muted-foreground">您还没有任何订单记录</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.display_id}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                      <TableCell><Badge variant="outline">{statusLabel(order.status)}</Badge></TableCell>
                      <TableCell className="text-right">{formatPrice(order.total, order.currency_code)}</TableCell>
                      <TableCell className="text-right">
                        <button onClick={() => setDetail(order)} className="text-sm text-gold hover:text-gold/80">查看详情</button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>上一页</Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>下一页</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

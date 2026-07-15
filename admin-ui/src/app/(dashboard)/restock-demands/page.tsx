"use client"

import { useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { BellRing, ChevronLeft, ChevronRight, Users } from "lucide-react"
import {
  RestockDemand,
  RestockDemandStatus,
  useRestockDemands,
} from "@/hooks/use-restock-demands"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 20

export default function RestockDemandsPage() {
  const t = useTranslations("restockDemands")
  const locale = useLocale()
  const [status, setStatus] = useState<RestockDemandStatus>("pending")
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<RestockDemand | null>(null)
  const { data, isLoading, isError, error } = useRestockDemands(
    status,
    page * PAGE_SIZE,
    PAGE_SIZE
  )

  const formatDate = (value: string | null) => value
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : t("notAvailable")

  const changeStatus = (nextStatus: RestockDemandStatus) => {
    setStatus(nextStatus)
    setPage(0)
  }

  const pageCount = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="inline-flex rounded-md border bg-background p-1">
        {(["pending", "restocked"] as RestockDemandStatus[]).map((value) => (
          <button
            key={value}
            onClick={() => changeStatus(value)}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              status === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`filters.${value}`)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.product")}</TableHead>
              <TableHead>{t("columns.sku")}</TableHead>
              <TableHead>{t("columns.requesters")}</TableHead>
              <TableHead>{t("columns.lastRequested")}</TableHead>
              <TableHead>{status === "pending" ? t("columns.status") : t("columns.restockedAt")}</TableHead>
              <TableHead className="text-right">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-destructive">
                  {t("loadFailed", { error: error instanceof Error ? error.message : "" })}
                </TableCell>
              </TableRow>
            ) : data?.restock_demands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  <BellRing className="mx-auto mb-3 h-7 w-7" />
                  {status === "pending" ? t("empty.pending") : t("empty.restocked")}
                </TableCell>
              </TableRow>
            ) : (
              data?.restock_demands.map((demand) => (
                <TableRow key={demand.id}>
                  <TableCell>
                    <Link href={`/products/${demand.product_id}`} className="font-medium hover:underline">
                      {demand.product_title}
                    </Link>
                    {demand.variant_title && (
                      <div className="mt-1 text-xs text-muted-foreground">{demand.variant_title}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{demand.sku || t("notAvailable")}</div>
                    {demand.specification.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {demand.specification.map((item) => `${item.name}: ${item.value}`).join(" / ")}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-semibold tabular-nums">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {demand.requester_count}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(demand.last_requested_at)}</TableCell>
                  <TableCell>
                    {status === "pending" ? (
                      <Badge variant="warning">{t("status.pending")}</Badge>
                    ) : (
                      <span className="text-sm">{formatDate(demand.restocked_at)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(demand)}>
                      <Users className="mr-2 h-4 w-4" />
                      {t("viewUsers")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {(data?.count || 0) > PAGE_SIZE && (
        <div className="flex items-center justify-end gap-3">
          <span className="text-sm text-muted-foreground">
            {t("pagination", { current: page + 1, total: pageCount })}
          </span>
          <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">{t("previous")}</span>
          </Button>
          <Button variant="outline" size="icon" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">{t("next")}</span>
          </Button>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto" onClose={() => setSelected(null)}>
          <DialogHeader>
            <DialogTitle>{t("users.title")}</DialogTitle>
            <DialogDescription>
              {selected?.product_title} · {t("users.summary", {
                logged: selected?.logged_user_count || 0,
                anonymous: selected?.anonymous_count || 0,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("users.name")}</TableHead>
                  <TableHead>{t("users.email")}</TableHead>
                  <TableHead>{t("users.requestedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selected?.logged_users.length ? selected.logged_users.map((user) => (
                  <TableRow key={user.customer_id}>
                    <TableCell>{[user.first_name, user.last_name].filter(Boolean).join(" ") || t("notAvailable")}</TableCell>
                    <TableCell>{user.email || t("notAvailable")}</TableCell>
                    <TableCell>{formatDate(user.requested_at)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      {t("users.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

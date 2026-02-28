"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useConversations, Conversation } from "@/hooks/use-chat"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, User, Globe } from "lucide-react"

interface ConversationListProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const t = useTranslations("chat")
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState("")
  const { data, isLoading } = useConversations({ status: statusFilter, q: search || undefined })

  const conversations = data?.conversations ?? []

  return (
    <div className="flex w-80 flex-col border-r">
      {/* Search */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 border-b px-3 py-2">
        {[undefined, "open", "closed"].map((s) => (
          <button
            key={s ?? "all"}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            {s === "open" ? t("statusOpen") : s === "closed" ? t("statusClosed") : t("allStatus")}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">{t("noConversations")}</div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedId}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ConversationItem({
  conversation: conv,
  isSelected,
  onClick,
}: {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}) {
  const t = useTranslations("chat")
  const isCustomer = !!conv.customer_id
  const label = isCustomer ? conv.customer_id : conv.visitor_id
  const timeStr = conv.last_message_at
    ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : ""

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        {isCustomer ? <User className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium">
            {isCustomer ? t("customer") : t("visitor")}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">{timeStr}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{conv.last_message_preview || "..."}</p>
      </div>
      {conv.unread_count > 0 && (
        <Badge variant="default" className="shrink-0 text-xs">
          {conv.unread_count}
        </Badge>
      )}
    </button>
  )
}

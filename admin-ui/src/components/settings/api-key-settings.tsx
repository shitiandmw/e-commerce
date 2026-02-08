"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  type AdminApiKey,
} from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Key,
  Plus,
  Copy,
  ShieldOff,
  Loader2,
  Check,
} from "lucide-react"

export function ApiKeySettings() {
  const t = useTranslations("settings")
  const { data, isLoading } = useApiKeys()
  const createApiKey = useCreateApiKey()
  const revokeApiKey = useRevokeApiKey()

  const [showCreate, setShowCreate] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [revokeId, setRevokeId] = React.useState<string | null>(null)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const keys = data?.api_keys || []

  const handleCreate = async () => {
    try {
      await createApiKey.mutateAsync({ title, type: "publishable" })
      setTitle("")
      setShowCreate(false)
    } catch {
      // shown in dialog
    }
  }

  const handleRevoke = async () => {
    if (!revokeId) return
    try {
      await revokeApiKey.mutateAsync(revokeId)
      setRevokeId(null)
    } catch {
      // shown in mutation
    }
  }

  const copyToken = (key: AdminApiKey) => {
    const token = key.token || key.redacted || key.id
    navigator.clipboard.writeText(token)
    setCopiedId(key.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("apiKeys.title")}</h2>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("apiKeys.createKey")}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("apiKeys.description")}
        </p>

        {keys.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("apiKeys.noKeys")}
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-start justify-between rounded-md border p-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{key.title}</span>
                    <Badge variant="outline">{key.type}</Badge>
                    {key.revoked_at ? (
                      <Badge variant="destructive">{t("apiKeys.revoked")}</Badge>
                    ) : (
                      <Badge variant="success">{t("apiKeys.active")}</Badge>
                    )}
                  </div>
                  <p className="text-sm font-mono text-muted-foreground truncate">
                    {key.redacted || key.token || "••••••••"}
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      {t("apiKeys.created")} {new Date(key.created_at).toLocaleDateString()}
                    </span>
                    {key.last_used_at && (
                      <span>
                        {t("apiKeys.lastUsed")}{" "}
                        {new Date(key.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToken(key)}
                    title={t("apiKeys.copyKey")}
                  >
                    {copiedId === key.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {!key.revoked_at && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRevokeId(key.id)}
                      title={t("apiKeys.revokeKey")}
                    >
                      <ShieldOff className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader>
            <DialogTitle>{t("apiKeys.createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-title">{t("apiKeys.titleLabel")}</Label>
              <Input
                id="key-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("apiKeys.titlePlaceholder")}
              />
            </div>
            {createApiKey.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {createApiKey.error instanceof Error
                  ? createApiKey.error.message
                  : t("apiKeys.createFailed")}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              {t("apiKeys.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createApiKey.isPending || !title}
            >
              {createApiKey.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("apiKeys.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
        <DialogContent onClose={() => setRevokeId(null)}>
          <DialogHeader>
            <DialogTitle>{t("apiKeys.revokeTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            {t("apiKeys.revokeConfirm")}
          </p>
          {revokeApiKey.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {revokeApiKey.error instanceof Error
                ? revokeApiKey.error.message
                : t("apiKeys.revokeFailed")}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeId(null)}>
              {t("apiKeys.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revokeApiKey.isPending}
            >
              {revokeApiKey.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("apiKeys.revoke")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

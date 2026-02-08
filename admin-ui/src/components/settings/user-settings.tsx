"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  useUsers,
  useInvites,
  useInviteUser,
  useDeleteInvite,
  type AdminUser,
  type AdminInvite,
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
  Users,
  UserPlus,
  Mail,
  Trash2,
  Loader2,
  Shield,
} from "lucide-react"

export function UserSettings() {
  const t = useTranslations("settings")
  const { data: usersData, isLoading: usersLoading } = useUsers()
  const { data: invitesData, isLoading: invitesLoading } = useInvites()
  const inviteUser = useInviteUser()
  const deleteInvite = useDeleteInvite()

  const [showInvite, setShowInvite] = React.useState(false)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [deleteInviteId, setDeleteInviteId] = React.useState<string | null>(null)

  const isLoading = usersLoading || invitesLoading

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const users = usersData?.users || []
  const invites = invitesData?.invites || []
  const pendingInvites = invites.filter((inv) => !inv.accepted)

  const handleInvite = async () => {
    try {
      await inviteUser.mutateAsync({ email: inviteEmail })
      setInviteEmail("")
      setShowInvite(false)
    } catch {
      // shown in dialog
    }
  }

  const handleDeleteInvite = async () => {
    if (!deleteInviteId) return
    try {
      await deleteInvite.mutateAsync(deleteInviteId)
      setDeleteInviteId(null)
    } catch {
      // shown in mutation state
    }
  }

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("users.title")}</h2>
          </div>
          <Button size="sm" onClick={() => setShowInvite(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("users.inviteUser")}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("users.description")}
        </p>

        {users.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("users.noMembers")}
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <UserRow key={user.id} user={user} t={t} />
            ))}
          </div>
        )}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("users.pendingInvitations")}</h2>
          </div>

          <div className="space-y-3">
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-md border p-4"
              >
                <div className="space-y-1">
                  <span className="font-medium">{inv.email}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {t("users.sent")} {new Date(inv.created_at).toLocaleDateString()}
                    </span>
                    <span>
                      {t("users.expires")} {new Date(inv.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">{t("users.pending")}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteInviteId(inv.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent onClose={() => setShowInvite(false)}>
          <DialogHeader>
            <DialogTitle>{t("users.inviteTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t("users.inviteDescription")}
            </p>
            <div className="space-y-2">
              <Label htmlFor="invite-email">{t("users.emailAddress")}</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t("users.emailPlaceholder")}
              />
            </div>
            {inviteUser.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {inviteUser.error instanceof Error
                  ? inviteUser.error.message
                  : t("users.inviteFailed")}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>
              {t("users.cancel")}
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviteUser.isPending || !inviteEmail}
            >
              {inviteUser.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {t("users.sendInvitation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Invite Confirmation */}
      <Dialog
        open={!!deleteInviteId}
        onOpenChange={(open) => !open && setDeleteInviteId(null)}
      >
        <DialogContent onClose={() => setDeleteInviteId(null)}>
          <DialogHeader>
            <DialogTitle>{t("users.revokeTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            {t("users.revokeConfirm")}
          </p>
          {deleteInvite.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {deleteInvite.error instanceof Error
                ? deleteInvite.error.message
                : t("users.revokeFailed")}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteInviteId(null)}>
              {t("users.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteInvite}
              disabled={deleteInvite.isPending}
            >
              {deleteInvite.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("users.revoke")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---- User Row ----

function UserRow({ user, t }: { user: AdminUser; t: (key: string) => string }) {
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ")

  return (
    <div className="flex items-center justify-between rounded-md border p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
          {displayName
            ? displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : user.email[0].toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {displayName || user.email}
            </span>
            {user.role && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {user.role}
              </Badge>
            )}
          </div>
          {displayName && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("users.joined")} {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}

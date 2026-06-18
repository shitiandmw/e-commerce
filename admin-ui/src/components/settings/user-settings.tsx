"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  useChangeOwnPassword,
  useCreateAdminUser,
  useCurrentAdminUser,
  useResetAdminUserPassword,
  useUpdateAdminUser,
  useUsers,
  type AdminUser,
} from "@/hooks/use-settings"
import { logout } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Edit,
  KeyRound,
  Loader2,
  Lock,
  Save,
  Shield,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react"

type Translator = (key: string) => string

const emptyCreateForm = {
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  confirm_password: "",
}

const emptyPasswordForm = {
  current_password: "",
  password: "",
  confirm_password: "",
}

function getDisplayName(user: AdminUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ")
}

function getInitials(user: AdminUser) {
  const displayName = getDisplayName(user)

  if (displayName) {
    return displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  return user.email[0]?.toUpperCase() || "U"
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function validatePassword(password: string, confirmPassword: string, t: Translator) {
  if (password.length < 10) return t("users.passwordTooShort")
  if (password !== password.trim()) return t("users.passwordNoEdgeSpaces")
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return t("users.passwordRequirements")
  }
  if (password !== confirmPassword) return t("users.passwordMismatch")
  return null
}

export function UserSettings() {
  return <AdminAccountSettings />
}

export function MyAccountSettings() {
  const t = useTranslations("settings")
  const router = useRouter()
  const {
    data: currentUserData,
    isLoading: currentUserLoading,
    error: currentUserError,
  } = useCurrentAdminUser()
  const updateUser = useUpdateAdminUser()
  const changeOwnPassword = useChangeOwnPassword()

  const [profileForm, setProfileForm] = React.useState({
    first_name: "",
    last_name: "",
    avatar_url: "",
  })
  const [profileSaved, setProfileSaved] = React.useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false)
  const [ownPasswordForm, setOwnPasswordForm] = React.useState(emptyPasswordForm)
  const [ownPasswordError, setOwnPasswordError] = React.useState<string | null>(null)

  const currentUser = currentUserData?.user

  React.useEffect(() => {
    if (currentUser) {
      setProfileForm({
        first_name: currentUser.first_name || "",
        last_name: currentUser.last_name || "",
        avatar_url: currentUser.avatar_url || "",
      })
    }
  }, [currentUser])

  const resetOwnPasswordForm = () => {
    setOwnPasswordForm(emptyPasswordForm)
    setOwnPasswordError(null)
  }

  const handlePasswordDialogOpenChange = (open: boolean) => {
    setShowPasswordDialog(open)
    if (!open) resetOwnPasswordForm()
  }

  const handleSaveProfile = async () => {
    if (!currentUser) return

    try {
      await updateUser.mutateAsync({
        id: currentUser.id,
        first_name: profileForm.first_name || null,
        last_name: profileForm.last_name || null,
        avatar_url: profileForm.avatar_url || null,
      })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch {
      // shown in form
    }
  }

  const handleChangeOwnPassword = async () => {
    const passwordError = validatePassword(
      ownPasswordForm.password,
      ownPasswordForm.confirm_password,
      t
    )

    if (passwordError) {
      setOwnPasswordError(passwordError)
      return
    }

    if (ownPasswordForm.current_password === ownPasswordForm.password) {
      setOwnPasswordError(t("users.passwordMustChange"))
      return
    }

    setOwnPasswordError(null)

    try {
      await changeOwnPassword.mutateAsync(ownPasswordForm)
      await logout()
      router.push("/login")
    } catch {
      // shown in dialog
    }
  }

  if (currentUserLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("users.myAccountTitle")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t("users.myAccountDescription")}</p>

        {currentUserError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {getErrorMessage(currentUserError, t("users.currentUserFailed"))}
          </div>
        )}

        {currentUser && (
          <>
            <div className="rounded-md border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {getInitials(currentUser)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {getDisplayName(currentUser) || currentUser.email}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{currentUser.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">{t("users.emailAddress")}</Label>
              <Input id="profile-email" value={currentUser.email} disabled />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-first-name">{t("users.firstName")}</Label>
                <Input
                  id="profile-first-name"
                  value={profileForm.first_name}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-last-name">{t("users.lastName")}</Label>
                <Input
                  id="profile-last-name"
                  value={profileForm.last_name}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-avatar">{t("users.avatarUrl")}</Label>
              <Input
                id="profile-avatar"
                type="url"
                value={profileForm.avatar_url}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    avatar_url: e.target.value,
                  }))
                }
                placeholder={t("users.avatarPlaceholder")}
              />
            </div>

            {updateUser.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {getErrorMessage(updateUser.error, t("users.updateFailed"))}
              </div>
            )}
            {profileSaved && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {t("users.updateSuccess")}
              </div>
            )}

            <Button onClick={handleSaveProfile} disabled={updateUser.isPending}>
              {updateUser.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("users.save")}
            </Button>
          </>
        )}
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">{t("users.securityTitle")}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{t("users.securityDescription")}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => handlePasswordDialogOpenChange(true)}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            {t("users.changeMyPassword")}
          </Button>
        </div>
      </div>

      <Dialog
        open={showPasswordDialog}
        onOpenChange={handlePasswordDialogOpenChange}
      >
        <DialogContent onClose={() => handlePasswordDialogOpenChange(false)}>
          <DialogHeader>
            <DialogTitle>{t("users.changePasswordTitle")}</DialogTitle>
            <DialogDescription>{t("users.changePasswordDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t("users.currentPassword")}</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={ownPasswordForm.current_password}
                onChange={(e) =>
                  setOwnPasswordForm((prev) => ({
                    ...prev,
                    current_password: e.target.value,
                  }))
                }
              />
            </div>
            <PasswordFields
              passwordId="new-own-password"
              confirmId="confirm-own-password"
              password={ownPasswordForm.password}
              confirmPassword={ownPasswordForm.confirm_password}
              passwordLabel={t("users.newPassword")}
              t={t}
              onPasswordChange={(password) =>
                setOwnPasswordForm((prev) => ({ ...prev, password }))
              }
              onConfirmPasswordChange={(confirm_password) =>
                setOwnPasswordForm((prev) => ({ ...prev, confirm_password }))
              }
            />

            {(ownPasswordError || changeOwnPassword.error) && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {ownPasswordError ||
                  getErrorMessage(changeOwnPassword.error, t("users.changePasswordFailed"))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handlePasswordDialogOpenChange(false)}
            >
              {t("users.cancel")}
            </Button>
            <Button
              onClick={handleChangeOwnPassword}
              disabled={
                changeOwnPassword.isPending ||
                !ownPasswordForm.current_password ||
                !ownPasswordForm.password ||
                !ownPasswordForm.confirm_password
              }
            >
              {changeOwnPassword.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("users.changeMyPassword")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function AdminAccountSettings() {
  const t = useTranslations("settings")
  const { data: usersData, isLoading: usersLoading, error: usersError } = useUsers()
  const {
    data: currentUserData,
    isLoading: currentUserLoading,
    error: currentUserError,
  } = useCurrentAdminUser()
  const createUser = useCreateAdminUser()
  const updateUser = useUpdateAdminUser()
  const resetPassword = useResetAdminUserPassword()

  const [showCreate, setShowCreate] = React.useState(false)
  const [createForm, setCreateForm] = React.useState(emptyCreateForm)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null)
  const [editForm, setEditForm] = React.useState({ first_name: "", last_name: "" })
  const [resetUser, setResetUser] = React.useState<AdminUser | null>(null)
  const [resetForm, setResetForm] = React.useState({ password: "", confirm_password: "" })
  const [resetError, setResetError] = React.useState<string | null>(null)
  const [editSaved, setEditSaved] = React.useState(false)

  const users = usersData?.users || []
  const currentUser = currentUserData?.user
  const isLoading = usersLoading || currentUserLoading

  React.useEffect(() => {
    if (editingUser) {
      setEditForm({
        first_name: editingUser.first_name || "",
        last_name: editingUser.last_name || "",
      })
    }
  }, [editingUser])

  const openCreateDialog = () => {
    setCreateForm(emptyCreateForm)
    setCreateError(null)
    setShowCreate(true)
  }

  const handleCreate = async () => {
    const passwordError = validatePassword(
      createForm.password,
      createForm.confirm_password,
      t
    )

    if (passwordError) {
      setCreateError(passwordError)
      return
    }

    setCreateError(null)

    try {
      await createUser.mutateAsync({
        email: createForm.email,
        first_name: createForm.first_name || undefined,
        last_name: createForm.last_name || undefined,
        password: createForm.password,
        confirm_password: createForm.confirm_password,
      })
      setCreateForm(emptyCreateForm)
      setShowCreate(false)
    } catch {
      // shown in dialog
    }
  }

  const handleUpdate = async () => {
    if (!editingUser) return

    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        first_name: editForm.first_name || null,
        last_name: editForm.last_name || null,
      })
      setEditSaved(true)
      setTimeout(() => setEditSaved(false), 2000)
      setEditingUser(null)
    } catch {
      // shown in dialog
    }
  }

  const handleResetPassword = async () => {
    if (!resetUser) return

    const passwordError = validatePassword(
      resetForm.password,
      resetForm.confirm_password,
      t
    )

    if (passwordError) {
      setResetError(passwordError)
      return
    }

    setResetError(null)

    try {
      await resetPassword.mutateAsync({
        id: resetUser.id,
        password: resetForm.password,
        confirm_password: resetForm.confirm_password,
      })
      setResetForm({ password: "", confirm_password: "" })
      setResetUser(null)
    } catch {
      // shown in dialog
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("users.title")}</h2>
          </div>
          <Button size="sm" onClick={openCreateDialog}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("users.createUser")}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{t("users.description")}</p>

        {usersError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {getErrorMessage(usersError, t("users.loadFailed"))}
          </div>
        )}
        {currentUserError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {getErrorMessage(currentUserError, t("users.currentUserFailed"))}
          </div>
        )}
        {editSaved && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            {t("users.updateSuccess")}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("users.noMembers")}
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUser?.id}
                isCurrentUserKnown={!!currentUser}
                t={t}
                onEdit={() => setEditingUser(user)}
                onReset={() => {
                  setResetError(null)
                  setResetForm({ password: "", confirm_password: "" })
                  setResetUser(user)
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader>
            <DialogTitle>{t("users.createTitle")}</DialogTitle>
            <DialogDescription>{t("users.createDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">{t("users.emailAddress")}</Label>
              <Input
                id="create-email"
                type="email"
                autoComplete="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder={t("users.emailPlaceholder")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-first-name">{t("users.firstName")}</Label>
                <Input
                  id="create-first-name"
                  value={createForm.first_name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-last-name">{t("users.lastName")}</Label>
                <Input
                  id="create-last-name"
                  value={createForm.last_name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <PasswordFields
              passwordId="create-password"
              confirmId="create-confirm-password"
              password={createForm.password}
              confirmPassword={createForm.confirm_password}
              t={t}
              onPasswordChange={(password) =>
                setCreateForm((prev) => ({ ...prev, password }))
              }
              onConfirmPasswordChange={(confirm_password) =>
                setCreateForm((prev) => ({ ...prev, confirm_password }))
              }
            />
            {(createError || createUser.error) && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {createError || getErrorMessage(createUser.error, t("users.createFailed"))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              {t("users.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createUser.isPending ||
                !createForm.email ||
                !createForm.password ||
                !createForm.confirm_password
              }
            >
              {createUser.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {t("users.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent onClose={() => setEditingUser(null)}>
          <DialogHeader>
            <DialogTitle>{t("users.editTitle")}</DialogTitle>
            <DialogDescription>{t("users.editDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("users.emailAddress")}</Label>
              <Input value={editingUser?.email || ""} disabled />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">{t("users.firstName")}</Label>
                <Input
                  id="edit-first-name"
                  value={editForm.first_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">{t("users.lastName")}</Label>
                <Input
                  id="edit-last-name"
                  value={editForm.last_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            {updateUser.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {getErrorMessage(updateUser.error, t("users.updateFailed"))}
              </div>
            )}
            {editSaved && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {t("users.updateSuccess")}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              {t("users.cancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={updateUser.isPending}>
              {updateUser.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("users.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resetUser}
        onOpenChange={(open) => !open && setResetUser(null)}
      >
        <DialogContent onClose={() => setResetUser(null)}>
          <DialogHeader>
            <DialogTitle>{t("users.resetPasswordTitle")}</DialogTitle>
            <DialogDescription>
              {t("users.resetPasswordDescription")}
              {resetUser ? ` ${resetUser.email}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <PasswordFields
              passwordId="reset-password"
              confirmId="reset-confirm-password"
              password={resetForm.password}
              confirmPassword={resetForm.confirm_password}
              t={t}
              onPasswordChange={(password) =>
                setResetForm((prev) => ({ ...prev, password }))
              }
              onConfirmPasswordChange={(confirm_password) =>
                setResetForm((prev) => ({ ...prev, confirm_password }))
              }
            />
            {(resetError || resetPassword.error) && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {resetError ||
                  getErrorMessage(resetPassword.error, t("users.resetPasswordFailed"))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>
              {t("users.cancel")}
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={
                resetPassword.isPending ||
                !resetForm.password ||
                !resetForm.confirm_password
              }
            >
              {resetPassword.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              {t("users.resetPassword")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PasswordFields({
  passwordId,
  confirmId,
  password,
  confirmPassword,
  passwordLabel,
  t,
  onPasswordChange,
  onConfirmPasswordChange,
}: {
  passwordId: string
  confirmId: string
  password: string
  confirmPassword: string
  passwordLabel?: string
  t: Translator
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={passwordId}>{passwordLabel || t("users.password")}</Label>
          <Input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={confirmId}>{t("users.confirmPassword")}</Label>
          <Input
            id={confirmId}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("users.passwordHint")}</p>
    </div>
  )
}

function UserRow({
  user,
  currentUserId,
  isCurrentUserKnown,
  t,
  onEdit,
  onReset,
}: {
  user: AdminUser
  currentUserId?: string
  isCurrentUserKnown: boolean
  t: Translator
  onEdit: () => void
  onReset: () => void
}) {
  const displayName = getDisplayName(user)
  const isCurrent = isCurrentUserKnown && user.id === currentUserId
  const canResetPassword = isCurrentUserKnown && !isCurrent

  return (
    <div className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {getInitials(user)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{displayName || user.email}</span>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {t("users.adminRole")}
            </Badge>
            {isCurrent && <Badge variant="secondary">{t("users.current")}</Badge>}
          </div>
          {displayName && (
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("users.joined")} {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          {t("users.edit")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!canResetPassword}
        >
          <KeyRound className="mr-2 h-4 w-4" />
          {t("users.resetPassword")}
        </Button>
      </div>
    </div>
  )
}

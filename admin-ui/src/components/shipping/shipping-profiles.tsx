"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  useShippingProfiles,
  useCreateShippingProfile,
  useDeleteShippingProfile,
} from "@/hooks/use-shipping"
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
} from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { Plus, Trash2, BoxIcon } from "lucide-react"

export function ShippingProfiles() {
  const t = useTranslations("shipping")
  const { data, isLoading } = useShippingProfiles()
  const createProfile = useCreateShippingProfile()
  const deleteProfile = useDeleteShippingProfile()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("default")

  const handleCreate = () => {
    if (!name.trim()) return
    createProfile.mutate(
      { name: name.trim(), type },
      {
        onSuccess: () => {
          setOpen(false)
          setName("")
          setType("default")
        },
      }
    )
  }

  const handleDelete = (id: string) => {
    if (!confirm(t("profiles.deleteConfirm"))) return
    deleteProfile.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const profiles = data?.shipping_profiles || []

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BoxIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("profiles.title")}</h2>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("profiles.addProfile")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profiles.addProfile")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">{t("profiles.form.name")}</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profiles.form.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-type">{t("profiles.form.type")}</Label>
              <Select
                id="profile-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="default">{t("profiles.form.default")}</option>
                <option value="gift_card">{t("profiles.form.giftCard")}</option>
                <option value="custom">{t("profiles.form.custom")}</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t("profiles.form.cancel")}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || createProfile.isPending}
              >
                {createProfile.isPending ? t("profiles.form.creating") : t("profiles.form.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-sm text-muted-foreground">
        {t("profiles.description")}
      </p>

      {profiles.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("profiles.noProfiles")}
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between rounded-md border p-4"
            >
              <div className="flex items-center gap-3">
                <BoxIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium text-sm">{profile.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {profile.type}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(profile.id)}
                disabled={deleteProfile.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

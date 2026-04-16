"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useStore, useUpdateStore } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, Loader2, Store } from "lucide-react"

export function StoreSettings() {
  const t = useTranslations("settings")
  const { data, isLoading } = useStore()
  const updateStore = useUpdateStore(data?.store?.id || "")
  const [name, setName] = React.useState("")
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    if (data?.store) {
      setName(data.store.name || "")
    }
  }, [data?.store])

  const handleSave = async () => {
    try {
      await updateStore.mutateAsync({ name })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // Error shown below
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const store = data?.store

  return (
    <div className="space-y-6">
      {/* Store Name */}
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("storeInfo.title")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("storeInfo.description")}
        </p>

        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">{t("storeInfo.storeName")}</Label>
            <Input
              id="store-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("storeInfo.storeNamePlaceholder")}
            />
          </div>

          {updateStore.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {updateStore.error instanceof Error
                ? updateStore.error.message
                : t("storeInfo.failedUpdate")}
            </div>
          )}

          {saved && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {t("storeInfo.savedSuccess")}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={updateStore.isPending}
          >
            {updateStore.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("storeInfo.saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("storeInfo.saveChanges")}
              </>
            )}
          </Button>
        </div>
      </div>

    </div>
  )
}

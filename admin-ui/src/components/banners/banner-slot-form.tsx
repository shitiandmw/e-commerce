"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  BannerSlot,
  useCreateBannerSlot,
  useUpdateBannerSlot,
} from "@/hooks/use-banners"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

const slotSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[a-z0-9_-]+$/, "Key must be lowercase alphanumeric with hyphens or underscores"),
  description: z.string().optional(),
})

type SlotFormData = z.infer<typeof slotSchema>

interface BannerSlotFormProps {
  slot?: BannerSlot
  mode: "create" | "edit"
}

export function BannerSlotForm({ slot, mode }: BannerSlotFormProps) {
  const t = useTranslations("banners")
  const router = useRouter()
  const createSlot = useCreateBannerSlot()
  const updateSlot = useUpdateBannerSlot(slot?.id || "")

  const defaultValues: SlotFormData = slot
    ? {
        name: slot.name,
        key: slot.key,
        description: slot.description || "",
      }
    : {
        name: "",
        key: "",
        description: "",
      }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SlotFormData>({
    resolver: zodResolver(slotSchema),
    defaultValues,
  })

  const onSubmit = async (data: SlotFormData) => {
    try {
      const payload: Record<string, any> = {
        name: data.name,
        key: data.key,
        description: data.description || undefined,
      }

      if (mode === "create") {
        await createSlot.mutateAsync(payload as any)
      } else {
        await updateSlot.mutateAsync(payload as any)
      }

      router.push("/banners")
    } catch (err) {
      // Error is handled by mutation state
    }
  }

  const mutationError =
    mode === "create" ? createSlot.error : updateSlot.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/banners">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? t("createSlot") : t("editSlot")}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? t("createSubtitle")
                : t("editSubtitle", { name: slot?.name ?? "" })}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? t("createSlot") : t("saveChanges")}
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {mutationError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {mutationError instanceof Error
            ? mutationError.message
            : t("errorOccurred")}
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Basic Info */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{t("form.basicInfo")}</h2>

          <div className="space-y-2">
            <Label htmlFor="name">{t("form.nameLabel")}</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder={t("form.namePlaceholder")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="key">{t("form.keyLabel")}</Label>
            <Input
              id="key"
              {...register("key")}
              placeholder={t("form.keyPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("form.keyHint")}
            </p>
            {errors.key && (
              <p className="text-sm text-destructive">
                {errors.key.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("form.descriptionLabel")}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t("form.descriptionPlaceholder")}
              rows={4}
            />
          </div>
        </div>
      </div>
    </form>
  )
}

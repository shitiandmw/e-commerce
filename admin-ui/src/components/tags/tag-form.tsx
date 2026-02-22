"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Tag,
  useCreateTag,
  useUpdateTag,
} from "@/hooks/use-tags"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

const tagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional().or(z.literal("")),
  type: z.enum(["badge", "attribute"]).default("badge"),
})

type TagFormData = z.infer<typeof tagSchema>

interface TagFormProps {
  tag?: Tag
  mode: "create" | "edit"
}

export function TagForm({ tag, mode }: TagFormProps) {
  const t = useTranslations("tags")
  const router = useRouter()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag(tag?.id || "")

  const defaultValues: TagFormData = tag
    ? {
        name: tag.name,
        color: tag.color || "",
        type: tag.type,
      }
    : {
        name: "",
        color: "",
        type: "badge",
      }

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues,
  })

  const watchedColor = watch("color")

  const onSubmit = async (data: TagFormData) => {
    try {
      const payload: Record<string, any> = {
        name: data.name,
        color: data.color || null,
        type: data.type,
      }

      if (mode === "create") {
        await createTag.mutateAsync(payload as any)
      } else {
        await updateTag.mutateAsync(payload as any)
      }

      router.push("/tags")
    } catch (err) {
      // Error is handled by mutation state
    }
  }

  const mutationError =
    mode === "create" ? createTag.error : updateTag.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tags">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? t("createTag") : t("editTag")}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? t("createSubtitle")
                : t("editSubtitle", { name: tag?.name ?? "" })}
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
              {mode === "create" ? t("createTag") : t("saveChanges")}
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

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
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
              <Label htmlFor="type">{t("form.typeLabel")}</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    <option value="badge">{t("typeOptions.badge")}</option>
                    <option value="attribute">{t("typeOptions.attribute")}</option>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                {t("form.typeHint")}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Color */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.color")}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full border-2 border-muted flex-shrink-0"
                  style={{ backgroundColor: watchedColor || "#e5e7eb" }}
                />
                <Input
                  id="color"
                  {...register("color")}
                  placeholder={t("form.colorPlaceholder")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("form.colorHint")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  CuratedCollection,
  useCreateCollection,
  useUpdateCollection,
} from "@/hooks/use-curated-collections"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z
    .string()
    .min(1, "Key is required")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Key must be lowercase letters, numbers and hyphens only"
    ),
  description: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
})

type CollectionFormData = z.infer<typeof collectionSchema>

interface CollectionFormProps {
  collection?: CuratedCollection
  mode: "create" | "edit"
}

export function CollectionForm({ collection, mode }: CollectionFormProps) {
  const t = useTranslations("collections")
  const router = useRouter()
  const createCollection = useCreateCollection()
  const updateCollection = useUpdateCollection(collection?.id || "")

  const defaultValues: CollectionFormData = collection
    ? {
        name: collection.name,
        key: collection.key,
        description: collection.description || "",
        sort_order: collection.sort_order,
      }
    : {
        name: "",
        key: "",
        description: "",
        sort_order: 0,
      }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues,
  })

  const onSubmit = async (data: CollectionFormData) => {
    try {
      const payload = {
        name: data.name,
        key: data.key,
        description: data.description || undefined,
        sort_order: data.sort_order,
      }

      if (mode === "create") {
        await createCollection.mutateAsync(payload)
      } else {
        await updateCollection.mutateAsync(payload)
      }

      router.push("/collections")
    } catch (err) {
      // Error is handled by mutation state
    }
  }

  const mutationError =
    mode === "create" ? createCollection.error : updateCollection.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/collections">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create"
                ? t("createCollection")
                : t("editCollection")}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? t("createSubtitle")
                : t("editSubtitle", { name: collection?.name ?? "" })}
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
              {mode === "create" ? t("createCollection") : t("saveChanges")}
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
              <Label htmlFor="description">
                {t("form.descriptionLabel")}
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder={t("form.descriptionPlaceholder")}
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">
              {t("form.sortOrderLabel")}
            </h2>
            <div className="space-y-2">
              <Label htmlFor="sort_order">{t("form.sortOrderLabel")}</Label>
              <Input
                id="sort_order"
                type="number"
                {...register("sort_order")}
                placeholder={t("form.sortOrderPlaceholder")}
              />
              {errors.sort_order && (
                <p className="text-sm text-destructive">
                  {errors.sort_order.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

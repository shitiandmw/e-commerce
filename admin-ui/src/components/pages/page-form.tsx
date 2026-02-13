"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Page,
  useCreatePage,
  useUpdatePage,
} from "@/hooks/use-pages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

const pageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]),
  template: z.string().optional(),
  sort_order: z.number().int().min(0),
})

type PageFormData = z.infer<typeof pageSchema>

const TEMPLATE_OPTIONS = [
  "about",
  "terms",
  "privacy",
  "faq",
  "shipping-policy",
  "returns",
  "quality",
] as const

interface PageFormProps {
  page?: Page
  mode: "create" | "edit"
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

export function PageForm({ page, mode }: PageFormProps) {
  const t = useTranslations("pages")
  const router = useRouter()
  const createPage = useCreatePage()
  const updatePage = useUpdatePage(page?.id || "")
  const [autoSlug, setAutoSlug] = React.useState(mode === "create")

  const defaultValues: PageFormData = page
    ? {
        title: page.title,
        slug: page.slug,
        content: page.content || "",
        status: page.status,
        template: page.template || "",
        sort_order: page.sort_order,
      }
    : {
        title: "",
        slug: "",
        content: "",
        status: "draft",
        template: "",
        sort_order: 0,
      }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues,
  })

  const title = watch("title")

  // Auto-generate slug from title
  React.useEffect(() => {
    if (autoSlug && title) {
      setValue("slug", slugify(title))
    }
  }, [title, autoSlug, setValue])

  const onSubmit = async (data: PageFormData) => {
    try {
      const payload: Record<string, any> = {
        title: data.title,
        slug: data.slug,
        content: data.content || undefined,
        status: data.status,
        template: data.template || null,
        sort_order: data.sort_order,
      }

      if (mode === "create") {
        await createPage.mutateAsync(payload as any)
      } else {
        await updatePage.mutateAsync(payload as any)
      }

      router.push("/pages")
    } catch (err) {
      // Error is handled by mutation state
    }
  }

  const mutationError =
    mode === "create" ? createPage.error : updatePage.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pages">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? t("createPage") : t("editPage")}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? t("createSubtitle")
                : t("editSubtitle", { name: page?.title ?? "" })}
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
              {mode === "create" ? t("createPage") : t("saveChanges")}
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
              <Label htmlFor="title">{t("form.titleLabel")}</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder={t("form.titlePlaceholder")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t("form.slugLabel")}</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder={t("form.slugPlaceholder")}
                onChange={(e) => {
                  setAutoSlug(false)
                  setValue("slug", e.target.value)
                }}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">
                  {errors.slug.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("form.slugHint")}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.contentLabel")}</h2>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  content={field.value || ""}
                  onChange={field.onChange}
                  placeholder={t("form.contentPlaceholder")}
                />
              )}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.statusLabel")}</h2>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                  <option value="draft">{t("status.draft")}</option>
                  <option value="published">{t("status.published")}</option>
                </Select>
              )}
            />
          </div>

          {/* Template */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.templateLabel")}</h2>
            <Controller
              name="template"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onChange={(e) => field.onChange(e.target.value === "none" ? "" : e.target.value)}
                >
                  <option value="none">{t("form.noTemplate")}</option>
                  {TEMPLATE_OPTIONS.map((tpl) => (
                    <option key={tpl} value={tpl}>
                      {t(`templates.${tpl}`)}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>

          {/* Sort Order */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.sortOrderLabel")}</h2>
            <Input
              type="number"
              {...register("sort_order", { valueAsNumber: true })}
              min={0}
            />
            {errors.sort_order && (
              <p className="text-sm text-destructive">
                {errors.sort_order.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}

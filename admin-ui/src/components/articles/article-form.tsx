"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Article,
  useCreateArticle,
  useUpdateArticle,
  useArticleCategories,
} from "@/hooks/use-articles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { MediaPicker } from "@/components/media/media-picker"
import { ArrowLeft, Save, Loader2, FolderOpen } from "lucide-react"
import Link from "next/link"

const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  category_id: z.string().optional(),
  cover_image: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  summary: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]),
  published_at: z.string().optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_pinned: z.boolean().default(false),
})

type ArticleFormData = z.infer<typeof articleSchema>

interface ArticleFormProps {
  article?: Article
  mode: "create" | "edit"
}

/**
 * Convert a string to a URL-friendly slug.
 * Supports Latin characters (kebab-case) and preserves CJK characters.
 */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function ArticleForm({ article, mode }: ArticleFormProps) {
  const t = useTranslations("articles")
  const router = useRouter()
  const createArticle = useCreateArticle()
  const updateArticle = useUpdateArticle(article?.id || "")
  const { data: categoriesData } = useArticleCategories()
  const categories = categoriesData?.article_categories ?? []

  const [coverPickerOpen, setCoverPickerOpen] = React.useState(false)
  const [autoSlug, setAutoSlug] = React.useState(mode === "create")

  const defaultValues: ArticleFormData = article
    ? {
        title: article.title,
        slug: article.slug,
        category_id: article.category_id || "",
        cover_image: article.cover_image || "",
        summary: article.summary || "",
        content: article.content || "",
        status: article.status,
        published_at: article.published_at
          ? article.published_at.slice(0, 16)
          : "",
        sort_order: article.sort_order ?? 0,
        is_pinned: article.is_pinned ?? false,
      }
    : {
        title: "",
        slug: "",
        category_id: "",
        cover_image: "",
        summary: "",
        content: "",
        status: "draft" as const,
        published_at: "",
        sort_order: 0,
        is_pinned: false,
      }

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues,
  })

  // Auto-generate slug from title
  const titleValue = watch("title")
  React.useEffect(() => {
    if (autoSlug && titleValue) {
      setValue("slug", toSlug(titleValue))
    }
  }, [titleValue, autoSlug, setValue])

  const onSubmit = async (data: ArticleFormData) => {
    try {
      const payload: Record<string, unknown> = {
        title: data.title,
        slug: data.slug,
        cover_image: data.cover_image || undefined,
        summary: data.summary || undefined,
        content: data.content || undefined,
        status: data.status,
        published_at: data.published_at
          ? new Date(data.published_at).toISOString()
          : null,
        sort_order: data.sort_order,
        is_pinned: data.is_pinned,
        category_id: data.category_id || undefined,
      }

      if (mode === "create") {
        await createArticle.mutateAsync(payload as any)
      } else {
        // For update, send null for cleared fields
        if (!data.cover_image) payload.cover_image = null
        if (!data.summary) payload.summary = null
        if (!data.content) payload.content = null
        if (!data.category_id) payload.category_id = null
        await updateArticle.mutateAsync(payload as any)
      }

      router.push("/articles")
    } catch (err) {
      // Error is handled by mutation state
    }
  }

  const mutationError =
    mode === "create" ? createArticle.error : updateArticle.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 pt-6 pb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/articles">
              <Button variant="ghost" size="icon" type="button">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {mode === "create" ? t("createArticle") : t("editArticle")}
              </h1>
              <p className="text-muted-foreground">
                {mode === "create"
                  ? t("createSubtitle")
                  : t("editSubtitle", { name: article?.title ?? "" })}
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
                {mode === "create" ? t("createArticle") : t("saveChanges")}
              </>
            )}
          </Button>
        </div>
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
                  setValue("slug", e.target.value)
                  setAutoSlug(false)
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t("form.slugHelp")}
              </p>
              {errors.slug && (
                <p className="text-sm text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">{t("form.summaryLabel")}</Label>
              <Textarea
                id="summary"
                {...register("summary")}
                placeholder={t("form.summaryPlaceholder")}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("form.contentLabel")}</Label>
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

          {/* Cover Image */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.coverImage")}</h2>
            <div className="space-y-2">
              <Label htmlFor="cover_image">
                {t("form.coverImageLabel")}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cover_image"
                  {...register("cover_image")}
                  placeholder={t("form.coverImagePlaceholder")}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCoverPickerOpen(true)}
                  className="flex-shrink-0"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {t("form.browseMedia")}
                </Button>
              </div>
              {errors.cover_image && (
                <p className="text-sm text-destructive">
                  {errors.cover_image.message}
                </p>
              )}
              {watch("cover_image") && (
                <div className="mt-2 w-full max-w-xs rounded-md overflow-hidden border bg-muted">
                  <img
                    src={watch("cover_image") as string}
                    alt="Cover preview"
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Cover Image Media Picker */}
          <MediaPicker
            open={coverPickerOpen}
            onOpenChange={setCoverPickerOpen}
            selectedUrls={
              watch("cover_image") ? [watch("cover_image") as string] : []
            }
            onSelect={(urls) => {
              if (urls.length > 0) {
                setValue("cover_image", urls[0], { shouldValidate: true })
              }
            }}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publishing */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.publishing")}</h2>

            <div className="space-y-2">
              <Label>{t("form.statusLabel")}</Label>
              <Select {...register("status")}>
                <option value="draft">{t("status.draft")}</option>
                <option value="published">{t("status.published")}</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="published_at">
                {t("form.publishedAtLabel")}
              </Label>
              <Input
                id="published_at"
                type="datetime-local"
                {...register("published_at")}
              />
            </div>
          </div>

          {/* Category */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">
              {t("form.categoryLabel")}
            </h2>
            <Select {...register("category_id")}>
              <option value="">{t("form.noCategory")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Sorting & Display */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.sorting")}</h2>

            <div className="space-y-2">
              <Label htmlFor="sort_order">{t("form.sortOrderLabel")}</Label>
              <Input
                id="sort_order"
                type="number"
                {...register("sort_order")}
                placeholder={t("form.sortOrderPlaceholder")}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="is_pinned"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="is_pinned"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                )}
              />
              <Label htmlFor="is_pinned" className="cursor-pointer">
                {t("form.isPinnedLabel")}
              </Label>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

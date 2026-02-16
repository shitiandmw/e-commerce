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
import { SeoEditor, SeoData } from "@/components/ui/seo-editor"
import { ArrowLeft, Save, Loader2, Languages } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const LOCALES = ["zh-CN", "en"] as const
type Locale = (typeof LOCALES)[number]
const LOCALE_LABELS: Record<Locale, string> = { "zh-CN": "中文", en: "English" }

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
  "about", "terms", "privacy", "faq",
  "shipping-policy", "returns", "quality",
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
    .replace(/[^\w\-\u4e00-\u9fff]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

export function PageForm({ page, mode }: PageFormProps) {
  const t = useTranslations("pages")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const createPage = useCreatePage()
  const updatePage = useUpdatePage(page?.id || "")
  const [autoSlug, setAutoSlug] = React.useState(mode === "create")
  const [seo, setSeo] = React.useState<SeoData>(page?.seo || {})
  const [activeLocale, setActiveLocale] = React.useState<Locale>("zh-CN")
  const [translations, setTranslations] = React.useState<Record<string, { title?: string; content?: string }>>(
    page?.translations || {}
  )

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
  React.useEffect(() => {
    if (autoSlug && title) {
      setValue("slug", slugify(title))
    }
  }, [title, autoSlug, setValue])

  const updateTranslation = (locale: string, field: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }))
  }

  const onSubmit = async (data: PageFormData) => {
    try {
      const payload: Record<string, any> = {
        title: data.title,
        slug: data.slug,
        content: data.content || undefined,
        status: data.status,
        template: data.template || null,
        sort_order: data.sort_order,
        seo: Object.values(seo).some(Boolean) ? seo : null,
        translations: Object.keys(translations).length > 0 ? translations : null,
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

  const mutationError = mode === "create" ? createPage.error : updatePage.error

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
              {mode === "create" ? t("createSubtitle") : t("editSubtitle", { name: page?.title ?? "" })}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("saving")}</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />{mode === "create" ? t("createPage") : t("saveChanges")}</>
          )}
        </Button>
      </div>

      {mutationError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {mutationError instanceof Error ? mutationError.message : t("errorOccurred")}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.basicInfo")}</h2>
            <div className="space-y-2">
              <Label htmlFor="title">{t("form.titleLabel")}</Label>
              <Input id="title" {...register("title")} placeholder={t("form.titlePlaceholder")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">{t("form.slugLabel")}</Label>
              <Input id="slug" {...register("slug")} placeholder={t("form.slugPlaceholder")} onChange={(e) => { setAutoSlug(false); setValue("slug", e.target.value) }} />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              <p className="text-xs text-muted-foreground">{t("form.slugHint")}</p>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.contentLabel")}</h2>
            <Controller name="content" control={control} render={({ field }) => (
              <RichTextEditor content={field.value || ""} onChange={field.onChange} placeholder={t("form.contentPlaceholder")} />
            )} />
          </div>

          {/* Locale Tabs - Translations */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">{tCommon("translations") || "多语言内容"}</h2>
            </div>
            <div className="flex gap-1 border-b">
              {LOCALES.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setActiveLocale(locale)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                    activeLocale === locale
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {LOCALE_LABELS[locale]}
                </button>
              ))}
            </div>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{t("form.titleLabel")} ({LOCALE_LABELS[activeLocale]})</Label>
                <Input
                  value={translations[activeLocale]?.title || ""}
                  onChange={(e) => updateTranslation(activeLocale, "title", e.target.value)}
                  placeholder={`${t("form.titlePlaceholder")} (${LOCALE_LABELS[activeLocale]})`}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("form.contentLabel")} ({LOCALE_LABELS[activeLocale]})</Label>
                <RichTextEditor
                  content={translations[activeLocale]?.content || ""}
                  onChange={(val) => updateTranslation(activeLocale, "content", val)}
                  placeholder={`${t("form.contentPlaceholder")} (${LOCALE_LABELS[activeLocale]})`}
                />
              </div>
            </div>
          </div>

          {/* SEO Editor */}
          <SeoEditor
            value={seo}
            onChange={setSeo}
            autoTitle={watch("title")}
            autoDescription={watch("content")}
            slug={watch("slug")}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.statusLabel")}</h2>
            <Controller name="status" control={control} render={({ field }) => (
              <Select value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <option value="draft">{t("status.draft")}</option>
                <option value="published">{t("status.published")}</option>
              </Select>
            )} />
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.templateLabel")}</h2>
            <Controller name="template" control={control} render={({ field }) => (
              <Select value={field.value || "none"} onChange={(e) => field.onChange(e.target.value === "none" ? "" : e.target.value)}>
                <option value="none">{t("form.noTemplate")}</option>
                {TEMPLATE_OPTIONS.map((tpl) => (
                  <option key={tpl} value={tpl}>{t(`templates.${tpl}`)}</option>
                ))}
              </Select>
            )} />
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.sortOrderLabel")}</h2>
            <Input type="number" {...register("sort_order", { valueAsNumber: true })} min={0} />
            {errors.sort_order && <p className="text-sm text-destructive">{errors.sort_order.message}</p>}
          </div>
        </div>
      </div>
    </form>
  )
}

"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MediaPicker } from "@/components/media/media-picker"
import { Wand2, FolderOpen, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SeoData {
  meta_title?: string
  meta_description?: string
  og_image?: string
  keywords?: string
}

export interface SeoEditorProps {
  value: SeoData
  onChange: (seo: SeoData) => void
  autoTitle?: string
  autoDescription?: string
  baseUrl?: string
  slug?: string
}

function stripHtml(html: string): string {
  // Remove HTML tags and decode entities for plain-text SEO descriptions
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function CharCounter({
  count,
  min,
  max,
}: {
  count: number
  min: number
  max: number
}) {
  const t = useTranslations("seo")
  const isGood = count >= min && count <= max
  const isTooLong = count > max
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        count === 0 && "text-muted-foreground",
        isGood && "text-green-600 dark:text-green-400",
        isTooLong && "text-destructive"
      )}
    >
      {t("characters", { count })}
    </span>
  )
}

export function SeoEditor({
  value,
  onChange,
  autoTitle,
  autoDescription,
  baseUrl = "https://yourstore.com",
  slug,
}: SeoEditorProps) {
  const t = useTranslations("seo")
  const [expanded, setExpanded] = React.useState(false)
  const [ogPickerOpen, setOgPickerOpen] = React.useState(false)

  const update = (patch: Partial<SeoData>) => {
    onChange({ ...value, ...patch })
  }

  const handleAutoGenerate = () => {
    const plainDesc = autoDescription ? stripHtml(autoDescription) : ""
    update({
      meta_title: (autoTitle || "").slice(0, 60),
      meta_description: plainDesc.slice(0, 160),
    })
  }

  const previewTitle = (value.meta_title || autoTitle || t("noTitle")).slice(
    0,
    60
  )
  const previewDescription = (
    value.meta_description ||
    (autoDescription ? stripHtml(autoDescription) : t("noDescription"))
  ).slice(0, 160)
  const previewUrl = slug
    ? `${baseUrl}/products/${slug}`
    : `${baseUrl}/products/...`

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-6 pb-6 pt-4 space-y-6">
          {/* Auto-generate button */}
          {(autoTitle || autoDescription) && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoGenerate}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {t("autoGenerate")}
              </Button>
            </div>
          )}

          {/* Meta Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo-meta-title">{t("metaTitle")}</Label>
              <CharCounter
                count={value.meta_title?.length ?? 0}
                min={50}
                max={60}
              />
            </div>
            <Input
              id="seo-meta-title"
              value={value.meta_title || ""}
              onChange={(e) => update({ meta_title: e.target.value })}
              placeholder={t("metaTitlePlaceholder")}
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">{t("metaTitleHint")}</p>
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo-meta-description">
                {t("metaDescription")}
              </Label>
              <CharCounter
                count={value.meta_description?.length ?? 0}
                min={120}
                max={160}
              />
            </div>
            <Textarea
              id="seo-meta-description"
              value={value.meta_description || ""}
              onChange={(e) => update({ meta_description: e.target.value })}
              placeholder={t("metaDescriptionPlaceholder")}
              rows={3}
              maxLength={320}
            />
            <p className="text-xs text-muted-foreground">
              {t("metaDescriptionHint")}
            </p>
          </div>

          {/* OG Image */}
          <div className="space-y-2">
            <Label htmlFor="seo-og-image">{t("ogImage")}</Label>
            <div className="flex gap-2">
              <Input
                id="seo-og-image"
                value={value.og_image || ""}
                onChange={(e) => update({ og_image: e.target.value })}
                placeholder={t("ogImagePlaceholder")}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOgPickerOpen(true)}
                className="flex-shrink-0"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("ogImageHint")}</p>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="seo-keywords">{t("keywords")}</Label>
            <Input
              id="seo-keywords"
              value={value.keywords || ""}
              onChange={(e) => update({ keywords: e.target.value })}
              placeholder={t("keywordsPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("keywordsHint")}
            </p>
          </div>

          {/* Search Engine Preview */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold">{t("preview")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("previewHint")}
              </p>
            </div>
            <div className="rounded-lg border bg-white dark:bg-zinc-950 p-4 space-y-1">
              {/* Google-style preview */}
              <p className="text-xs text-[#202124] dark:text-zinc-400 truncate">
                {previewUrl}
              </p>
              <h3 className="text-lg leading-snug text-[#1a0dab] dark:text-blue-400 hover:underline cursor-default truncate">
                {previewTitle}
              </h3>
              <p className="text-sm text-[#4d5156] dark:text-zinc-400 line-clamp-2">
                {previewDescription}
              </p>
            </div>
          </div>

          {/* OG Image Media Picker */}
          <MediaPicker
            open={ogPickerOpen}
            onOpenChange={setOgPickerOpen}
            selectedUrls={value.og_image ? [value.og_image] : []}
            onSelect={(urls) => {
              if (urls.length > 0) {
                update({ og_image: urls[0] })
              }
            }}
          />
        </div>
      )}
    </div>
  )
}

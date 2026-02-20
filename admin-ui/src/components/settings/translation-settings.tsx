"use client"

import * as React from "react"
import {
  useTranslationStats,
  useSaveBulkTranslations,
  getTranslationProgress,
  getOverallProgress,
  NON_DEFAULT_LOCALES,
  type TranslatableResourceStat,
  type TranslatableResourceItem,
} from "@/hooks/use-translation-manager"
import {
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  type TranslationLocale,
} from "@/hooks/use-entity-translation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Languages,
  ChevronDown,
  ChevronRight,
  Save,
  Loader2,
  Settings2,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ---- Main Component ----

export function TranslationSettings() {
  const [activeLocale, setActiveLocale] = React.useState<TranslationLocale>(
    NON_DEFAULT_LOCALES[0]
  )
  const [view, setView] = React.useState<"overview" | "edit" | "manage">("overview")
  const [editingResource, setEditingResource] = React.useState<string | null>(null)

  const { data, isLoading } = useTranslationStats(activeLocale)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const stats = data?.stats || []

  if (view === "edit") {
    return (
      <BulkTranslationEditor
        stats={stats}
        activeLocale={activeLocale}
        onLocaleChange={setActiveLocale}
        editingResource={editingResource}
        onBack={() => { setView("overview"); setEditingResource(null) }}
      />
    )
  }

  if (view === "manage") {
    return (
      <ManageResourcesPanel
        stats={stats}
        onBack={() => setView("overview")}
      />
    )
  }

  // Overview
  return (
    <TranslationOverview
      stats={stats}
      activeLocale={activeLocale}
      onLocaleChange={setActiveLocale}
      onEditAll={() => { setEditingResource(null); setView("edit") }}
      onEditResource={(ref) => { setEditingResource(ref); setView("edit") }}
      onManage={() => setView("manage")}
    />
  )
}

// ---- Overview Component ----

function TranslationOverview({
  stats,
  activeLocale,
  onLocaleChange,
  onEditAll,
  onEditResource,
  onManage,
}: {
  stats: TranslatableResourceStat[]
  activeLocale: TranslationLocale
  onLocaleChange: (l: TranslationLocale) => void
  onEditAll: () => void
  onEditResource: (ref: string) => void
  onManage: () => void
}) {
  const overall = getOverallProgress(stats, activeLocale)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">翻译管理</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onManage}>
            <Settings2 className="mr-2 h-4 w-4" />
            管理资源
          </Button>
          <Button size="sm" onClick={onEditAll}>
            批量编辑翻译
          </Button>
        </div>
      </div>

      {/* Locale Selector */}
      <LocaleSelector activeLocale={activeLocale} onChange={onLocaleChange} />

      {/* Overall Progress */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">
            {LOCALE_LABELS[activeLocale]} 翻译进度
          </h3>
          <span className="text-sm text-muted-foreground">
            {overall.translated} / {overall.total} 项已翻译
          </span>
        </div>
        <ProgressBar percentage={overall.percentage} />
        <p className="mt-2 text-sm text-muted-foreground">
          总体完成度 {overall.percentage}%
        </p>
      </div>

      {/* Per-Resource Stats */}
      <div className="space-y-3">
        {stats.map((stat) => {
          const progress = getTranslationProgress(stat, activeLocale)
          return (
            <div
              key={stat.reference}
              className="rounded-lg border bg-card p-4 shadow-sm hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => onEditResource(stat.reference)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stat.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({stat.fields.join(", ")})
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {progress.translated} / {progress.total}
                </span>
              </div>
              <ProgressBar percentage={progress.percentage} size="sm" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Bulk Translation Editor ----

function BulkTranslationEditor({
  stats,
  activeLocale,
  onLocaleChange,
  editingResource,
  onBack,
}: {
  stats: TranslatableResourceStat[]
  activeLocale: TranslationLocale
  onLocaleChange: (l: TranslationLocale) => void
  editingResource: string | null
  onBack: () => void
}) {
  const saveBulk = useSaveBulkTranslations()
  const [edits, setEdits] = React.useState<
    Record<string, Record<string, Record<string, string>>>
  >({})
  const [saved, setSaved] = React.useState(false)

  // Initialize edits from existing translations
  React.useEffect(() => {
    const initial: Record<string, Record<string, Record<string, string>>> = {}
    for (const stat of stats) {
      initial[stat.reference] = {}
      for (const item of stat.items) {
        const existing = item.translations?.[activeLocale] || {}
        initial[stat.reference][item.id] = { ...existing }
      }
    }
    setEdits(initial)
    setSaved(false)
  }, [stats, activeLocale])

  const filteredStats = editingResource
    ? stats.filter((s) => s.reference === editingResource)
    : stats

  const handleFieldChange = (
    reference: string,
    itemId: string,
    field: string,
    value: string
  ) => {
    setEdits((prev) => ({
      ...prev,
      [reference]: {
        ...prev[reference],
        [itemId]: {
          ...prev[reference]?.[itemId],
          [field]: value,
        },
      },
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    const entries: Array<{
      reference: string
      reference_id: string
      locale_code: string
      translations: Record<string, string>
    }> = []

    for (const stat of filteredStats) {
      for (const item of stat.items) {
        const itemEdits = edits[stat.reference]?.[item.id]
        if (itemEdits && Object.values(itemEdits).some((v) => v?.trim())) {
          entries.push({
            reference: stat.reference,
            reference_id: item.id,
            locale_code: activeLocale,
            translations: itemEdits,
          })
        }
      }
    }

    await saveBulk.mutateAsync(entries)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveAndClose = async () => {
    await handleSave()
    onBack()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← 返回
          </Button>
          <h2 className="text-lg font-semibold">
            {editingResource
              ? `编辑 ${filteredStats[0]?.label || ""} 翻译`
              : "批量编辑翻译"}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saveBulk.isPending}
          >
            {saveBulk.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            保存
          </Button>
          <Button size="sm" onClick={handleSaveAndClose} disabled={saveBulk.isPending}>
            保存并关闭
          </Button>
        </div>
      </div>

      {saved && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
          <Check className="h-4 w-4" />
          翻译已保存
        </div>
      )}

      {/* Locale Selector */}
      <LocaleSelector activeLocale={activeLocale} onChange={onLocaleChange} nonDefaultOnly />

      {/* Editor Groups */}
      {filteredStats.map((stat) => (
        <ResourceEditorGroup
          key={stat.reference}
          stat={stat}
          activeLocale={activeLocale}
          edits={edits[stat.reference] || {}}
          onFieldChange={(itemId, field, value) =>
            handleFieldChange(stat.reference, itemId, field, value)
          }
        />
      ))}
    </div>
  )
}

// ---- Resource Editor Group ----

function ResourceEditorGroup({
  stat,
  activeLocale,
  edits,
  onFieldChange,
}: {
  stat: TranslatableResourceStat
  activeLocale: TranslationLocale
  edits: Record<string, Record<string, string>>
  onFieldChange: (itemId: string, field: string, value: string) => void
}) {
  const [expanded, setExpanded] = React.useState(true)

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="font-medium">{stat.label}</span>
          <span className="text-xs text-muted-foreground">
            ({stat.items.length} 项)
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t divide-y">
          {stat.items.map((item) => (
            <div key={item.id} className="p-4 space-y-3">
              <div className="text-sm font-medium text-muted-foreground">
                {item.displayValue || item.id}
              </div>
              {stat.fields.map((field) => (
                <div key={field} className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {field} (原文)
                    </label>
                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                      {getOriginalValue(item, field, stat.displayField) || (
                        <span className="text-muted-foreground italic">空</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {field} ({LOCALE_LABELS[activeLocale]})
                    </label>
                    <Input
                      value={edits[item.id]?.[field] || ""}
                      onChange={(e) =>
                        onFieldChange(item.id, field, e.target.value)
                      }
                      placeholder={`输入 ${LOCALE_LABELS[activeLocale]} 翻译...`}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
          {stat.items.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              暂无可翻译内容
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---- Manage Resources Panel ----

function ManageResourcesPanel({
  stats,
  onBack,
}: {
  stats: TranslatableResourceStat[]
  onBack: () => void
}) {
  const [enabledResources, setEnabledResources] = React.useState<
    Record<string, boolean>
  >(() => {
    const map: Record<string, boolean> = {}
    for (const s of stats) map[s.reference] = true
    return map
  })
  const [enabledFields, setEnabledFields] = React.useState<
    Record<string, Record<string, boolean>>
  >(() => {
    const map: Record<string, Record<string, boolean>> = {}
    for (const s of stats) {
      map[s.reference] = {}
      for (const f of s.fields) map[s.reference][f] = true
    }
    return map
  })
  const [expandedResource, setExpandedResource] = React.useState<string | null>(null)

  const allEnabled = Object.values(enabledResources).every(Boolean)

  const toggleAll = () => {
    const newVal = !allEnabled
    const newResources: Record<string, boolean> = {}
    const newFields: Record<string, Record<string, boolean>> = {}
    for (const s of stats) {
      newResources[s.reference] = newVal
      newFields[s.reference] = {}
      for (const f of s.fields) newFields[s.reference][f] = newVal
    }
    setEnabledResources(newResources)
    setEnabledFields(newFields)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← 返回
          </Button>
          <h2 className="text-lg font-semibold">管理可翻译资源</h2>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        选择需要翻译的资源类型和字段。禁用的资源将不会出现在批量编辑器中。
      </p>

      {/* Select All */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
        <span className="font-medium">全选</span>
        <Switch checked={allEnabled} onCheckedChange={toggleAll} />
      </div>

      {/* Resource List */}
      <div className="space-y-2">
        {stats.map((stat) => (
          <div key={stat.reference} className="rounded-lg border bg-card shadow-sm">
            <div className="flex items-center justify-between p-4">
              <button
                type="button"
                className="flex items-center gap-2 text-left"
                onClick={() =>
                  setExpandedResource(
                    expandedResource === stat.reference ? null : stat.reference
                  )
                }
              >
                {expandedResource === stat.reference ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium">{stat.label}</span>
                <span className="text-xs text-muted-foreground">
                  {stat.fields.length} 个字段
                </span>
              </button>
              <Switch
                checked={enabledResources[stat.reference] ?? true}
                onCheckedChange={(checked) => {
                  setEnabledResources((prev) => ({
                    ...prev,
                    [stat.reference]: checked,
                  }))
                  const newFields: Record<string, boolean> = {}
                  for (const f of stat.fields) newFields[f] = checked
                  setEnabledFields((prev) => ({
                    ...prev,
                    [stat.reference]: newFields,
                  }))
                }}
              />
            </div>

            {expandedResource === stat.reference && (
              <div className="border-t px-4 py-3 space-y-2">
                {stat.fields.map((field) => (
                  <div
                    key={field}
                    className="flex items-center justify-between py-1 pl-6"
                  >
                    <span className="text-sm">{field}</span>
                    <Switch
                      checked={enabledFields[stat.reference]?.[field] ?? true}
                      onCheckedChange={(checked) => {
                        setEnabledFields((prev) => ({
                          ...prev,
                          [stat.reference]: {
                            ...prev[stat.reference],
                            [field]: checked,
                          },
                        }))
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Shared UI Components ----

function LocaleSelector({
  activeLocale,
  onChange,
  nonDefaultOnly,
}: {
  activeLocale: TranslationLocale
  onChange: (l: TranslationLocale) => void
  nonDefaultOnly?: boolean
}) {
  const locales = nonDefaultOnly ? NON_DEFAULT_LOCALES : NON_DEFAULT_LOCALES

  return (
    <div className="flex items-center gap-3">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">目标语言：</span>
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => onChange(locale)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              activeLocale === locale
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {LOCALE_LABELS[locale]}
          </button>
        ))}
      </div>
    </div>
  )
}

function ProgressBar({
  percentage,
  size = "md",
}: {
  percentage: number
  size?: "sm" | "md"
}) {
  return (
    <div
      className={cn(
        "w-full rounded-full bg-muted",
        size === "sm" ? "h-1.5" : "h-2.5"
      )}
    >
      <div
        className={cn(
          "rounded-full transition-all duration-300",
          size === "sm" ? "h-1.5" : "h-2.5",
          percentage === 100
            ? "bg-green-500"
            : percentage > 50
              ? "bg-blue-500"
              : percentage > 0
                ? "bg-amber-500"
                : "bg-muted-foreground/20"
        )}
        style={{ width: `${Math.max(percentage, 0)}%` }}
      />
    </div>
  )
}

function getOriginalValue(
  item: TranslatableResourceItem,
  field: string,
  displayField: string
): string {
  // The original value is stored in the default locale or as the item's direct field
  if (field === displayField) return item.displayValue || ""
  // For other fields, check if there's a zh-CN translation or return empty
  const defaultT = item.translations?.[DEFAULT_LOCALE]
  if (defaultT?.[field]) return defaultT[field]
  return ""
}

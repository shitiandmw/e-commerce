"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { MenuItem } from "@/hooks/use-menus"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Loader2, ImageIcon, X } from "lucide-react"
import { MediaPicker } from "@/components/media/media-picker"

const menuItemSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().min(1, "URL is required"),
  icon_url: z.string().optional(),
  is_enabled: z.boolean(),
  parent_id: z.string(),
  metadata: z.string().optional(),
})

type MenuItemFormData = z.infer<typeof menuItemSchema>

interface FlatOption {
  id: string
  label: string
  depth: number
}

function flattenMenuItems(
  items: MenuItem[],
  depth: number = 0,
  excludeId?: string
): FlatOption[] {
  const result: FlatOption[] = []
  for (const item of items) {
    if (item.id !== excludeId) {
      result.push({ id: item.id, label: item.label, depth })
      if (item.children && item.children.length > 0) {
        result.push(
          ...flattenMenuItems(item.children, depth + 1, excludeId)
        )
      }
    }
  }
  return result
}

interface MenuItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    label: string
    url: string
    icon_url?: string
    is_enabled: boolean
    parent_id?: string | null
    metadata?: Record<string, unknown>
  }) => Promise<void>
  isLoading: boolean
  /** Existing item for editing, undefined for creation */
  item?: MenuItem
  /** All top-level menu items for parent selector */
  allItems: MenuItem[]
  /** Pre-selected parent_id when adding a child item */
  defaultParentId?: string | null
}

export function MenuItemForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  item,
  allItems,
  defaultParentId,
}: MenuItemFormProps) {
  const t = useTranslations("menus")
  const isEdit = !!item

  const parentOptions = React.useMemo(
    () => flattenMenuItems(allItems, 0, item?.id),
    [allItems, item?.id]
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      label: "",
      url: "",
      icon_url: "",
      is_enabled: true,
      parent_id: "",
      metadata: "{}",
    },
  })

  // Reset form when opening
  React.useEffect(() => {
    if (open) {
      if (item) {
        reset({
          label: item.label,
          url: item.url,
          icon_url: item.icon_url || "",
          is_enabled: item.is_enabled,
          parent_id: item.parent_id || "",
          metadata: item.metadata ? JSON.stringify(item.metadata, null, 2) : "{}",
        })
      } else {
        reset({
          label: "",
          url: "",
          icon_url: "",
          is_enabled: true,
          parent_id: defaultParentId || "",
          metadata: "{}",
        })
      }
    }
  }, [open, item, defaultParentId, reset])

  const iconUrl = watch("icon_url")
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false)

  const handleFormSubmit = async (data: MenuItemFormData) => {
    let metadata: Record<string, unknown> | undefined
    if (data.metadata && data.metadata.trim() !== "" && data.metadata.trim() !== "{}") {
      try {
        metadata = JSON.parse(data.metadata)
      } catch {
        // Ignore invalid JSON
      }
    }

    await onSubmit({
      label: data.label,
      url: data.url,
      icon_url: data.icon_url || undefined,
      is_enabled: data.is_enabled,
      parent_id: data.parent_id || null,
      metadata,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("itemForm.editTitle") : t("itemForm.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 mt-4"
        >
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="item-label">{t("itemForm.labelField")}</Label>
            <Input
              id="item-label"
              {...register("label")}
              placeholder={t("itemForm.labelPlaceholder")}
            />
            {errors.label && (
              <p className="text-sm text-destructive">
                {errors.label.message}
              </p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="item-url">{t("itemForm.urlField")}</Label>
            <Input
              id="item-url"
              {...register("url")}
              placeholder={t("itemForm.urlPlaceholder")}
            />
            {errors.url && (
              <p className="text-sm text-destructive">
                {errors.url.message}
              </p>
            )}
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>{t("itemForm.iconUrlField")}</Label>
            {iconUrl ? (
              <div className="relative group w-16 h-16 rounded-md overflow-hidden border border-border">
                <img src={iconUrl} alt="" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onClick={() => setMediaPickerOpen(true)}
                  >
                    <ImageIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6"
                    onClick={() => setValue("icon_url", "", { shouldValidate: true })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMediaPickerOpen(true)}
                className="w-16 h-16 rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground"
              >
                <ImageIcon className="h-5 w-5" />
                <span className="text-[10px]">圖標</span>
              </button>
            )}
            <input type="hidden" {...register("icon_url")} />
          </div>

          {/* Parent */}
          <div className="space-y-2">
            <Label htmlFor="item-parent">{t("itemForm.parentField")}</Label>
            <Select id="item-parent" {...register("parent_id")}>
              <option value="">{t("itemForm.parentNone")}</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {"─".repeat(opt.depth)} {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="item-enabled"
              {...register("is_enabled")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="item-enabled" className="cursor-pointer">
              {t("itemForm.enabledField")}
            </Label>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <Label htmlFor="item-metadata">{t("itemForm.metadataField")}</Label>
            <Textarea
              id="item-metadata"
              {...register("metadata")}
              placeholder={t("itemForm.metadataPlaceholder")}
              rows={3}
              className="font-mono text-xs"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("itemForm.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("itemForm.saving")}
                </>
              ) : (
                t("itemForm.save")
              )}
            </Button>
          </DialogFooter>
        </form>

        <MediaPicker
          open={mediaPickerOpen}
          onOpenChange={setMediaPickerOpen}
          onSelect={(urls) => {
            if (urls.length > 0) {
              setValue("icon_url", urls[0], { shouldValidate: true })
            }
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

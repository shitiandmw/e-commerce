"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  BannerItem,
  useCreateBannerItem,
  useUpdateBannerItem,
} from "@/hooks/use-banners"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, ImageIcon } from "lucide-react"

const itemSchema = z.object({
  image_url: z.string().min(1, "Image URL is required"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  link_url: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_enabled: z.boolean().default(true),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

type ItemFormData = z.infer<typeof itemSchema>

interface BannerItemFormProps {
  slotId: string
  item?: BannerItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function toDatetimeLocal(dateStr?: string | null): string {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    // Format as YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ""
  }
}

export function BannerItemForm({
  slotId,
  item,
  open,
  onOpenChange,
  onSuccess,
}: BannerItemFormProps) {
  const t = useTranslations("banners")
  const isEdit = !!item
  const createItem = useCreateBannerItem()
  const updateItem = useUpdateBannerItem(item?.id || "")

  const defaultValues: ItemFormData = item
    ? {
        image_url: item.image_url,
        title: item.title || "",
        subtitle: item.subtitle || "",
        link_url: item.link_url || "",
        sort_order: item.sort_order,
        is_enabled: item.is_enabled,
        starts_at: toDatetimeLocal(item.starts_at),
        ends_at: toDatetimeLocal(item.ends_at),
      }
    : {
        image_url: "",
        title: "",
        subtitle: "",
        link_url: "",
        sort_order: 0,
        is_enabled: true,
        starts_at: "",
        ends_at: "",
      }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues,
  })

  // Reset form when item changes
  React.useEffect(() => {
    if (open) {
      reset(
        item
          ? {
              image_url: item.image_url,
              title: item.title || "",
              subtitle: item.subtitle || "",
              link_url: item.link_url || "",
              sort_order: item.sort_order,
              is_enabled: item.is_enabled,
              starts_at: toDatetimeLocal(item.starts_at),
              ends_at: toDatetimeLocal(item.ends_at),
            }
          : {
              image_url: "",
              title: "",
              subtitle: "",
              link_url: "",
              sort_order: 0,
              is_enabled: true,
              starts_at: "",
              ends_at: "",
            }
      )
    }
  }, [open, item, reset])

  const isEnabled = watch("is_enabled")
  const imageUrl = watch("image_url")

  const onSubmit = async (data: ItemFormData) => {
    try {
      const payload: any = {
        image_url: data.image_url,
        title: data.title || null,
        subtitle: data.subtitle || null,
        link_url: data.link_url || null,
        sort_order: data.sort_order,
        is_enabled: data.is_enabled,
        starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
        ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
      }

      if (isEdit) {
        await updateItem.mutateAsync(payload)
      } else {
        await createItem.mutateAsync({ ...payload, slot_id: slotId })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      // Error handled by mutation state
    }
  }

  const mutationError = isEdit ? updateItem.error : createItem.error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("itemForm.editTitle") : t("itemForm.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Error */}
          {mutationError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {mutationError instanceof Error
                ? mutationError.message
                : t("errorOccurred")}
            </div>
          )}

          {/* Image URL + Preview */}
          <div className="space-y-2">
            <Label htmlFor="image_url">{t("itemForm.imageUrlLabel")}</Label>
            <Input
              id="image_url"
              {...register("image_url")}
              placeholder={t("itemForm.imageUrlPlaceholder")}
            />
            {errors.image_url && (
              <p className="text-sm text-destructive">
                {errors.image_url.message}
              </p>
            )}
            {imageUrl && (
              <div className="mt-2 rounded-lg border overflow-hidden bg-muted aspect-[16/9] max-h-40 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t("itemForm.titleLabel")}</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder={t("itemForm.titlePlaceholder")}
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="subtitle">{t("itemForm.subtitleLabel")}</Label>
            <Input
              id="subtitle"
              {...register("subtitle")}
              placeholder={t("itemForm.subtitlePlaceholder")}
            />
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <Label htmlFor="link_url">{t("itemForm.linkUrlLabel")}</Label>
            <Input
              id="link_url"
              {...register("link_url")}
              placeholder={t("itemForm.linkUrlPlaceholder")}
            />
          </div>

          {/* Sort Order & Enabled */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sort_order">{t("itemForm.sortOrderLabel")}</Label>
              <Input
                id="sort_order"
                type="number"
                {...register("sort_order")}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("itemForm.enabledLabel")}</Label>
              <div className="pt-2">
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(val) => setValue("is_enabled", val)}
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts_at">{t("itemForm.startsAtLabel")}</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                {...register("starts_at")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at">{t("itemForm.endsAtLabel")}</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                {...register("ends_at")}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("itemForm.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("itemForm.saving")}
                </>
              ) : (
                t("itemForm.save")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

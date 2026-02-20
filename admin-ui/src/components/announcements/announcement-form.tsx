"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Announcement,
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from "@/hooks/use-announcements"
import { useEntityTranslation } from "@/hooks/use-entity-translation"
import { LocaleSwitcher } from "@/components/ui/locale-switcher"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

const announcementSchema = z.object({
  text: z.string().min(1, "Text is required"),
  link_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  sort_order: z.coerce.number().int().default(0),
  is_enabled: z.boolean().default(true),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

interface AnnouncementFormProps {
  announcement?: Announcement | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnnouncementForm({
  announcement,
  open,
  onOpenChange,
}: AnnouncementFormProps) {
  const t = useTranslations("announcements")
  const isEdit = !!announcement
  const createAnnouncement = useCreateAnnouncement()
  const updateAnnouncement = useUpdateAnnouncement(announcement?.id || "")

  const translation = useEntityTranslation({
    reference: "announcement",
    referenceId: announcement?.id,
    translatableFields: ["content", "link_text"],
  })

  const formatDateForInput = (dateStr?: string | null) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      // Format as local datetime string for input[type=datetime-local]
      const pad = (n: number) => String(n).padStart(2, "0")
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch {
      return ""
    }
  }

  const defaultValues: AnnouncementFormData = announcement
    ? {
        text: announcement.text,
        link_url: announcement.link_url || "",
        sort_order: announcement.sort_order,
        is_enabled: announcement.is_enabled,
        starts_at: formatDateForInput(announcement.starts_at),
        ends_at: formatDateForInput(announcement.ends_at),
      }
    : {
        text: "",
        link_url: "",
        sort_order: 0,
        is_enabled: true,
        starts_at: "",
        ends_at: "",
      }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues,
  })

  // Reset form when announcement changes or dialog opens
  React.useEffect(() => {
    if (open) {
      reset(
        announcement
          ? {
              text: announcement.text,
              link_url: announcement.link_url || "",
              sort_order: announcement.sort_order,
              is_enabled: announcement.is_enabled,
              starts_at: formatDateForInput(announcement.starts_at),
              ends_at: formatDateForInput(announcement.ends_at),
            }
          : {
              text: "",
              link_url: "",
              sort_order: 0,
              is_enabled: true,
              starts_at: "",
              ends_at: "",
            }
      )
    }
  }, [open, announcement, reset])

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      const payload: Record<string, unknown> = {
        text: data.text,
        link_url: data.link_url || null,
        sort_order: data.sort_order,
        is_enabled: data.is_enabled,
        starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
        ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
      }

      if (isEdit) {
        await updateAnnouncement.mutateAsync(payload as any)
      } else {
        await createAnnouncement.mutateAsync(payload as any)
      }

      await translation.saveAllTranslations()

      onOpenChange(false)
    } catch {
      // Error handled by mutation state
    }
  }

  const mutationError = isEdit
    ? updateAnnouncement.error
    : createAnnouncement.error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editAnnouncement") : t("createAnnouncement")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("editSubtitle") : t("createSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {mutationError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {mutationError instanceof Error
                ? mutationError.message
                : t("errorOccurred")}
            </div>
          )}

          {/* Locale Switcher */}
          {isEdit && (
            <LocaleSwitcher
              activeLocale={translation.activeLocale}
              onChange={translation.setActiveLocale}
            />
          )}

          {/* Text */}
          <div className="space-y-2">
            <Label htmlFor="text">{t("form.textLabel")}</Label>
            {translation.isDefaultLocale ? (
              <Textarea
                id="text"
                {...register("text")}
                placeholder={t("form.textPlaceholder")}
                rows={3}
              />
            ) : (
              <Textarea
                id="text"
                value={translation.getFieldValue("content", "")}
                onChange={(e) => translation.setFieldValue("content", e.target.value)}
                placeholder="尚未翻译"
                rows={3}
              />
            )}
            {errors.text && (
              <p className="text-sm text-destructive">{errors.text.message}</p>
            )}
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <Label htmlFor="link_url">{t("form.linkUrlLabel")}</Label>
            <Input
              id="link_url"
              {...register("link_url")}
              placeholder={t("form.linkUrlPlaceholder")}
            />
            {errors.link_url && (
              <p className="text-sm text-destructive">
                {errors.link_url.message}
              </p>
            )}
          </div>

          {/* Sort Order & Enabled */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sort_order">{t("form.sortOrderLabel")}</Label>
              <Input
                id="sort_order"
                type="number"
                {...register("sort_order", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("form.enabledLabel")}</Label>
              <div className="pt-1">
                <Controller
                  control={control}
                  name="is_enabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts_at">{t("form.startsAtLabel")}</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                {...register("starts_at")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at">{t("form.endsAtLabel")}</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                {...register("ends_at")}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("form.saving")}
                </>
              ) : isEdit ? (
                t("form.save")
              ) : (
                t("form.create")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Popup,
  useCreatePopup,
  useUpdatePopup,
} from "@/hooks/use-popups"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { MediaPicker } from "@/components/media/media-picker"
import { ArrowLeft, Save, Loader2, ImageIcon, X, Maximize2 } from "lucide-react"
import Link from "next/link"

const popupSchema = z.object({
  title: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  image_url: z.string().optional().or(z.literal("")),
  button_text: z.string().optional().or(z.literal("")),
  button_link: z.string().optional().or(z.literal("")),
  is_enabled: z.boolean(),
  trigger_type: z.enum(["first_visit", "every_visit", "specific_page"]),
  display_frequency: z.enum(["once", "once_per_session", "once_per_day"]),
  target_page: z.string().optional().or(z.literal("")),
  sort_order: z.coerce.number().min(0),
})

type PopupFormData = z.infer<typeof popupSchema>

interface PopupFormProps {
  popup?: Popup
  mode: "create" | "edit"
}

export function PopupForm({ popup, mode }: PopupFormProps) {
  const t = useTranslations("popups")
  const router = useRouter()
  const createPopup = useCreatePopup()
  const updatePopup = useUpdatePopup(popup?.id || "")
  const [showMediaPicker, setShowMediaPicker] = React.useState(false)

  const defaultValues: PopupFormData = popup
    ? {
        title: popup.title || "",
        description: popup.description || "",
        image_url: popup.image_url || "",
        button_text: popup.button_text || "",
        button_link: popup.button_link || "",
        is_enabled: popup.is_enabled,
        trigger_type: popup.trigger_type,
        display_frequency: popup.display_frequency,
        target_page: popup.target_page || "",
        sort_order: popup.sort_order,
      }
    : {
        title: "",
        description: "",
        image_url: "",
        button_text: "",
        button_link: "",
        is_enabled: false,
        trigger_type: "first_visit" as const,
        display_frequency: "once" as const,
        target_page: "",
        sort_order: 0,
      }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PopupFormData>({
    resolver: zodResolver(popupSchema),
    defaultValues,
  })

  const watchedValues = watch()
  const triggerType = watch("trigger_type")

  const onSubmit = async (data: PopupFormData) => {
    try {
      const payload: Record<string, unknown> = {
        title: data.title || null,
        description: data.description || null,
        image_url: data.image_url || null,
        button_text: data.button_text || null,
        button_link: data.button_link || null,
        is_enabled: data.is_enabled,
        trigger_type: data.trigger_type,
        display_frequency: data.display_frequency,
        target_page: data.trigger_type === "specific_page" ? (data.target_page || null) : null,
        sort_order: data.sort_order,
      }

      if (mode === "create") {
        await createPopup.mutateAsync(payload as any)
      } else {
        await updatePopup.mutateAsync(payload as any)
      }

      router.push("/popups")
    } catch (err) {
      // Error is handled by mutation state
    }
  }

  const mutationError =
    mode === "create" ? createPopup.error : updatePopup.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/popups">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? t("createPopup") : t("editPopup")}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? t("createSubtitle")
                : t("editSubtitle", { name: popup?.title ?? "" })}
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
              {mode === "create" ? t("createPopup") : t("saveChanges")}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("form.descriptionLabel")}</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder={t("form.descriptionPlaceholder")}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("form.imageLabel")}</Label>
              <div className="flex items-center gap-3">
                {watchedValues.image_url ? (
                  <div className="relative h-20 w-32 rounded-md border overflow-hidden bg-muted">
                    <img
                      src={watchedValues.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setValue("image_url", "")}
                      className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 hover:bg-background"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="h-20 w-32 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setShowMediaPicker(true)}
                  >
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMediaPicker(true)}
                >
                  {t("form.selectImage")}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="button_text">{t("form.buttonTextLabel")}</Label>
                <Input
                  id="button_text"
                  {...register("button_text")}
                  placeholder={t("form.buttonTextPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="button_link">{t("form.buttonLinkLabel")}</Label>
                <Input
                  id="button_link"
                  {...register("button_link")}
                  placeholder={t("form.buttonLinkPlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Trigger Configuration */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.triggerConfig")}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trigger_type">{t("form.triggerTypeLabel")}</Label>
                <Select id="trigger_type" {...register("trigger_type")}>
                  <option value="first_visit">{t("triggerType.first_visit")}</option>
                  <option value="every_visit">{t("triggerType.every_visit")}</option>
                  <option value="specific_page">{t("triggerType.specific_page")}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_frequency">{t("form.displayFrequencyLabel")}</Label>
                <Select id="display_frequency" {...register("display_frequency")}>
                  <option value="once">{t("displayFrequency.once")}</option>
                  <option value="once_per_session">{t("displayFrequency.once_per_session")}</option>
                  <option value="once_per_day">{t("displayFrequency.once_per_day")}</option>
                </Select>
              </div>
            </div>

            {triggerType === "specific_page" && (
              <div className="space-y-2">
                <Label htmlFor="target_page">{t("form.targetPageLabel")}</Label>
                <Input
                  id="target_page"
                  {...register("target_page")}
                  placeholder={t("form.targetPagePlaceholder")}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sort_order">{t("form.sortOrderLabel")}</Label>
              <Input
                id="sort_order"
                type="number"
                {...register("sort_order")}
                placeholder="0"
                className="w-32"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.statusSection")}</h2>
            <Controller
              name="is_enabled"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t("form.enabledLabel")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("form.enabledDescription")}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={`
                      relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                      transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-ring focus-visible:ring-offset-2
                      ${field.value ? "bg-primary" : "bg-input"}
                    `}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0
                        transition duration-200 ease-in-out
                        ${field.value ? "translate-x-5" : "translate-x-0"}
                      `}
                    />
                  </button>
                </div>
              )}
            />
          </div>

          {/* Preview */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Maximize2 className="h-5 w-5" />
              {t("form.preview")}
            </h2>
            <div className="rounded-lg border bg-background p-4 space-y-3">
              {watchedValues.image_url && (
                <div className="w-full h-32 rounded-md overflow-hidden bg-muted">
                  <img
                    src={watchedValues.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {watchedValues.title && (
                <h3 className="text-base font-semibold">
                  {watchedValues.title}
                </h3>
              )}
              {watchedValues.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {watchedValues.description}
                </p>
              )}
              {watchedValues.button_text && (
                <Button size="sm" className="w-full" type="button">
                  {watchedValues.button_text}
                </Button>
              )}
              {!watchedValues.title && !watchedValues.description && !watchedValues.image_url && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t("form.previewEmpty")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Media Picker */}
      <MediaPicker
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={(urls) => {
          if (urls.length > 0) {
            setValue("image_url", urls[0])
          }
        }}
        selectedUrls={watchedValues.image_url ? [watchedValues.image_url] : []}
      />
    </form>
  )
}

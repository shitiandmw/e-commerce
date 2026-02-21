"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Brand,
  useCreateBrand,
  useUpdateBrand,
} from "@/hooks/use-brands"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MediaPicker } from "@/components/media/media-picker"
import { ArrowLeft, Save, Loader2, FolderOpen } from "lucide-react"
import Link from "next/link"

const brandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
})

type BrandFormData = z.infer<typeof brandSchema>

interface BrandFormProps {
  brand?: Brand
  mode: "create" | "edit"
}

export function BrandForm({ brand, mode }: BrandFormProps) {
  const t = useTranslations("brands")
  const router = useRouter()
  const createBrand = useCreateBrand()
  const updateBrand = useUpdateBrand(brand?.id || "")

  const defaultValues: BrandFormData = brand
    ? {
        name: brand.name,
        description: brand.description || "",
        logo_url: brand.logo_url || "",
      }
    : {
        name: "",
        description: "",
        logo_url: "",
      }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues,
  })

  const [logoPickerOpen, setLogoPickerOpen] = React.useState(false)

  const onSubmit = async (data: BrandFormData) => {
    try {
      const payload: Record<string, any> = {
        name: data.name,
        description: data.description || undefined,
        logo_url: data.logo_url || undefined,
      }

      if (mode === "create") {
        await createBrand.mutateAsync(payload as any)
      } else {
        await updateBrand.mutateAsync(payload as any)
      }

      router.push("/brands")
    } catch (err) {
      // Error is handled by mutation state
    }
  }

  const mutationError =
    mode === "create" ? createBrand.error : updateBrand.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/brands">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? t("createBrand") : t("editBrand")}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? t("createSubtitle")
                : t("editSubtitle", { name: brand?.name ?? "" })}
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
              {mode === "create" ? t("createBrand") : t("saveChanges")}
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
              <Label htmlFor="description">{t("form.descriptionLabel")}</Label>
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
          {/* Logo */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.logo")}</h2>
            <div className="space-y-2">
              <Label htmlFor="logo_url">{t("form.logoUrlLabel")}</Label>
              <div className="flex gap-2">
                <Input
                  id="logo_url"
                  {...register("logo_url")}
                  placeholder={t("form.logoUrlPlaceholder")}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setLogoPickerOpen(true)} className="flex-shrink-0">
                  <FolderOpen className="h-4 w-4 mr-2" />{t("form.browseMedia")}
                </Button>
              </div>
              {errors.logo_url && (
                <p className="text-sm text-destructive">
                  {errors.logo_url.message}
                </p>
              )}
              {watch("logo_url") && (
                <div className="mt-2 w-24 h-24 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                  <img src={watch("logo_url") as string} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>
          <MediaPicker
            open={logoPickerOpen}
            onOpenChange={setLogoPickerOpen}
            selectedUrls={watch("logo_url") ? [watch("logo_url") as string] : []}
            onSelect={(urls) => { if (urls.length > 0) setValue("logo_url", urls[0], { shouldValidate: true }) }}
          />
        </div>
      </div>
    </form>
  )
}

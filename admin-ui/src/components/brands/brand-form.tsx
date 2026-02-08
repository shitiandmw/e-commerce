"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { ArrowLeft, Save, Loader2 } from "lucide-react"
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
    formState: { errors, isSubmitting },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues,
  })

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
              {mode === "create" ? "Create Brand" : "Edit Brand"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? "Add a new brand to your catalog"
                : `Editing ${brand?.name}`}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? "Create Brand" : "Save Changes"}
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {mutationError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {mutationError instanceof Error
            ? mutationError.message
            : "An error occurred"}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Brand name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe the brand..."
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Logo</h2>
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                {...register("logo_url")}
                placeholder="https://example.com/logo.png"
              />
              {errors.logo_url && (
                <p className="text-sm text-destructive">
                  {errors.logo_url.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Product,
  useCreateProduct,
  useUpdateProduct,
  useCategories,
} from "@/hooks/use-products"
import {
  useBrands,
  useLinkProductBrand,
  useUnlinkProductBrand,
} from "@/hooks/use-brands"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  ImageIcon,
  Save,
  Loader2,
} from "lucide-react"
import Link from "next/link"

const variantSchema = z.object({
  title: z.string().min(1, "Variant title is required"),
  sku: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  currency_code: z.string().default("usd"),
  inventory_quantity: z.coerce.number().int().min(0).default(0),
  manage_inventory: z.boolean().default(true),
})

const optionSchema = z.object({
  title: z.string().min(1, "Option title is required"),
  values: z.string().min(1, "At least one value is required"),
})

const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  handle: z.string().optional(),
  status: z.enum(["draft", "proposed", "published", "rejected"]),
  thumbnail: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  images: z.array(z.object({ url: z.string().url("Must be a valid URL") })),
  weight: z.coerce.number().optional().or(z.literal("")),
  length: z.coerce.number().optional().or(z.literal("")),
  height: z.coerce.number().optional().or(z.literal("")),
  width: z.coerce.number().optional().or(z.literal("")),
  options: z.array(optionSchema),
  variants: z.array(variantSchema),
  category_ids: z.array(z.string()),
  brand_id: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product
  mode: "create" | "edit"
}

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct(product?.id || "")
  const { data: categoriesData } = useCategories()
  const { data: brandsData } = useBrands({ limit: 100 })
  const linkProductBrand = useLinkProductBrand()
  const unlinkProductBrand = useUnlinkProductBrand()

  const categories = categoriesData?.product_categories ?? []
  const brands = brandsData?.brands ?? []

  const defaultValues: ProductFormData = product
    ? {
        title: product.title,
        subtitle: product.subtitle || "",
        description: product.description || "",
        handle: product.handle || "",
        status: product.status,
        thumbnail: product.thumbnail || "",
        images: product.images?.map((i) => ({ url: i.url })) || [],
        weight: product.weight ?? "",
        length: product.length ?? "",
        height: product.height ?? "",
        width: product.width ?? "",
        options:
          product.options?.map((o) => ({
            title: o.title,
            values: o.values?.map((v) => v.value).join(", ") || "",
          })) || [],
        variants:
          product.variants?.map((v) => ({
            title: v.title,
            sku: v.sku || "",
            price: v.prices?.[0]?.amount
              ? v.prices[0].amount / 100
              : 0,
            currency_code: v.prices?.[0]?.currency_code || "usd",
            inventory_quantity: v.inventory_quantity || 0,
            manage_inventory: v.manage_inventory ?? true,
          })) || [],
        category_ids: product.categories?.map((c) => c.id) || [],
        brand_id: product.brand?.id || "",
      }
    : {
        title: "",
        subtitle: "",
        description: "",
        handle: "",
        status: "draft" as const,
        thumbnail: "",
        images: [],
        weight: "",
        length: "",
        height: "",
        width: "",
        options: [],
        variants: [
          {
            title: "Default",
            sku: "",
            price: 0,
            currency_code: "usd",
            inventory_quantity: 0,
            manage_inventory: true,
          },
        ],
        category_ids: [],
        brand_id: "",
      }

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues,
  })

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control, name: "images" })

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: "options" })

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: "variants" })

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Build the API payload
      const payload: Record<string, any> = {
        title: data.title,
        subtitle: data.subtitle || undefined,
        description: data.description || undefined,
        handle: data.handle || undefined,
        status: data.status,
        thumbnail: data.thumbnail || undefined,
        images: data.images.length > 0 ? data.images : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        length: data.length ? Number(data.length) : undefined,
        height: data.height ? Number(data.height) : undefined,
        width: data.width ? Number(data.width) : undefined,
      }

      if (data.category_ids.length > 0) {
        payload.categories = data.category_ids.map((id) => ({ id }))
      }

      if (mode === "create") {
        // Include options and variants for creation
        if (data.options.length > 0) {
          payload.options = data.options.map((opt) => ({
            title: opt.title,
            values: opt.values.split(",").map((v) => v.trim()),
          }))
        }

        payload.variants = data.variants.map((v) => ({
          title: v.title,
          sku: v.sku || undefined,
          prices: [
            {
              amount: Math.round(v.price * 100),
              currency_code: v.currency_code,
            },
          ],
          manage_inventory: v.manage_inventory,
          options: {},
        }))

        const result = await createProduct.mutateAsync(payload) as any
        const newProductId = result?.product?.id

        // Link brand to product if selected
        if (data.brand_id && newProductId) {
          await linkProductBrand.mutateAsync({
            product_id: newProductId,
            brand_id: data.brand_id,
          })
        }
      } else {
        await updateProduct.mutateAsync(payload)

        // Handle brand link changes
        const oldBrandId = product?.brand?.id
        const newBrandId = data.brand_id || undefined

        if (oldBrandId !== newBrandId) {
          // Unlink old brand
          if (oldBrandId && product?.id) {
            await unlinkProductBrand.mutateAsync({
              product_id: product.id,
              brand_id: oldBrandId,
            })
          }
          // Link new brand
          if (newBrandId && product?.id) {
            await linkProductBrand.mutateAsync({
              product_id: product.id,
              brand_id: newBrandId,
            })
          }
        }
      }

      router.push("/products")
    } catch (err) {
      // Error is handled by mutation state
    }
  }

  const mutationError =
    mode === "create" ? createProduct.error : updateProduct.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? "Create Product" : "Edit Product"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? "Add a new product to your catalog"
                : `Editing ${product?.title}`}
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
              {mode === "create" ? "Create Product" : "Save Changes"}
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
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Product title"
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                {...register("subtitle")}
                placeholder="Optional subtitle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your product..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                {...register("handle")}
                placeholder="product-handle (auto-generated if empty)"
              />
            </div>
          </div>

          {/* Media */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Media</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendImage({ url: "" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Image
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                {...register("thumbnail")}
                placeholder="https://example.com/image.jpg"
              />
              {errors.thumbnail && (
                <p className="text-sm text-destructive">
                  {errors.thumbnail.message}
                </p>
              )}
            </div>

            {imageFields.length > 0 && (
              <div className="space-y-3">
                <Label>Additional Images</Label>
                {imageFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      {...register(`images.${index}.url`)}
                      placeholder="Image URL"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImage(index)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Options</h2>
                <p className="text-sm text-muted-foreground">
                  Define product options like size, color, material
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendOption({ title: "", values: "" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>

            {optionFields.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No options defined. Add options like Size, Color, etc.
              </p>
            ) : (
              <div className="space-y-4">
                {optionFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-3 rounded-md border p-4"
                  >
                    <div className="flex-1 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Option Name</Label>
                        <Input
                          {...register(`options.${index}.title`)}
                          placeholder="e.g. Size, Color"
                        />
                        {errors.options?.[index]?.title && (
                          <p className="text-sm text-destructive">
                            {errors.options[index]?.title?.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Values (comma separated)</Label>
                        <Input
                          {...register(`options.${index}.values`)}
                          placeholder="e.g. S, M, L, XL"
                        />
                        {errors.options?.[index]?.values && (
                          <p className="text-sm text-destructive">
                            {errors.options[index]?.values?.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Variants</h2>
                <p className="text-sm text-muted-foreground">
                  Define pricing and inventory for each variant
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendVariant({
                    title: "",
                    sku: "",
                    price: 0,
                    currency_code: "usd",
                    inventory_quantity: 0,
                    manage_inventory: true,
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </div>

            {variantFields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-md border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    Variant {index + 1}
                  </h3>
                  {variantFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeVariant(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      {...register(`variants.${index}.title`)}
                      placeholder="e.g. Small / Red"
                    />
                    {errors.variants?.[index]?.title && (
                      <p className="text-sm text-destructive">
                        {errors.variants[index]?.title?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input
                      {...register(`variants.${index}.sku`)}
                      placeholder="SKU-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.price`)}
                      placeholder="0.00"
                    />
                    {errors.variants?.[index]?.price && (
                      <p className="text-sm text-destructive">
                        {errors.variants[index]?.price?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select {...register(`variants.${index}.currency_code`)}>
                      <option value="usd">USD</option>
                      <option value="eur">EUR</option>
                      <option value="gbp">GBP</option>
                      <option value="cny">CNY</option>
                      <option value="jpy">JPY</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Inventory</Label>
                    <Input
                      type="number"
                      {...register(`variants.${index}.inventory_quantity`)}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end space-x-2 pb-2">
                    <input
                      type="checkbox"
                      {...register(`variants.${index}.manage_inventory`)}
                      id={`manage-inv-${index}`}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label
                      htmlFor={`manage-inv-${index}`}
                      className="cursor-pointer"
                    >
                      Manage inventory
                    </Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Status</h2>
            <Select {...register("status")}>
              <option value="draft">Draft</option>
              <option value="proposed">Proposed</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          {/* Brand */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Brand</h2>
            <Select {...register("brand_id")}>
              <option value="">No brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Categories */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Categories</h2>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories available.
              </p>
            ) : (
              <Controller
                name="category_ids"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {field.value.map((catId) => {
                          const cat = categories.find((c) => c.id === catId)
                          return (
                            <Badge
                              key={catId}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() =>
                                field.onChange(
                                  field.value.filter((id) => id !== catId)
                                )
                              }
                            >
                              {cat?.name || catId}
                              <X className="ml-1 h-3 w-3" />
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                    <Select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value
                        if (val && !field.value.includes(val)) {
                          field.onChange([...field.value, val])
                        }
                      }}
                    >
                      <option value="">Select a category...</option>
                      {categories
                        .filter((c) => !field.value.includes(c.id))
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </Select>
                  </div>
                )}
              />
            )}
          </div>

          {/* Dimensions */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Dimensions</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (g)</Label>
                <Input
                  id="weight"
                  type="number"
                  {...register("weight")}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Length (mm)</Label>
                <Input
                  id="length"
                  type="number"
                  {...register("length")}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (mm)</Label>
                <Input
                  id="width"
                  type="number"
                  {...register("width")}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (mm)</Label>
                <Input
                  id="height"
                  type="number"
                  {...register("height")}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

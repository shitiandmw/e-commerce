"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Product,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
  useSyncProductVariantConfiguration,
  useCategories,
  useLinkProductCategory,
  useUnlinkProductCategory,
} from "@/hooks/use-products"
import {
  useBrands,
  useLinkProductBrand,
  useUnlinkProductBrand,
} from "@/hooks/use-brands"
import {
  useStockLocations,
  fetchStockLocations,
  fetchProductInventorySnapshot,
  ensureInventoryForVariant,
} from "@/hooks/use-inventory"
import {
  useTags,
  useLinkProductTag,
  useUnlinkProductTag,
} from "@/hooks/use-tags"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CategoryTreeSelect } from "@/components/ui/category-tree-select"
import {
  ArrowLeft,
  Plus,
  X,
  ImageIcon,
  Save,
  Loader2,
  FolderOpen,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { MediaPicker } from "@/components/media/media-picker"
import { SeoEditor, type SeoData } from "@/components/ui/seo-editor"
import {
  ProductAttributesEditor,
  type AttributeItem,
} from "@/components/products/product-attributes-editor"
import { toSlug } from "@/lib/slug"
import { withDefaultShippingProfile } from "@/lib/shipping-profiles"
import {
  useProductShippingOptions,
  useShippingOptions,
  useSyncProductShippingOptions,
} from "@/hooks/use-shipping"
import {
  productShippingOptionIdsSchema,
  toggleShippingOptionId,
} from "@/lib/shipping-form-state"
import { useProductShippingOptionsInitialization } from "@/hooks/use-shipping-form-state"
import { ProductVariantEditor } from "@/components/products/product-variant-editor"
import {
  createDefaultProductVariantConfiguration,
  getConfigurationChangeSummary,
  getConfigurationErrors,
  initializeProductVariantConfiguration,
  stopPendingDeleteVariant,
  type ProductVariantConfiguration,
} from "@/lib/product-variant-config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { AdminApiError } from "@/lib/admin-api"

/** brand field may be a single object or an array (due to isList link) */
function resolveBrand(brand: Product["brand"]): { id: string; name: string } | null {
  if (!brand) return null
  if (Array.isArray(brand)) return brand[0] ?? null
  return brand
}

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
  category_ids: z.array(z.string()),
  brand_id: z.string().optional(),
  tag_ids: z.array(z.string()),
  shipping_option_ids: productShippingOptionIdsSchema,
})

type ProductFormData = z.infer<typeof productSchema>

const variantDeleteBlockedCodes = new Set([
  "PRODUCT_VARIANT_DELETE_HAS_INVENTORY",
  "PRODUCT_VARIANT_DELETE_HAS_ORDERS",
  "PRODUCT_VARIANT_DELETE_HAS_RESTOCK_DEMAND",
])

type BlockedVariantDelete = {
  data: ProductFormData
  error: AdminApiError
  retryError?: Error
}

function getBlockedVariantDeleteError(error: Error) {
  if (
    error instanceof AdminApiError &&
    error.code &&
    variantDeleteBlockedCodes.has(error.code) &&
    error.variantId
  ) {
    return error
  }
  return null
}

interface ProductFormProps {
  product?: Product
  mode: "create" | "edit"
  returnTo?: string
}

export function ProductForm({
  product,
  mode,
  returnTo = "/products",
}: ProductFormProps) {
  const t = useTranslations("products")
  const router = useRouter()
  const createProduct = useCreateProduct()
  const deleteProduct = useDeleteProduct()
  const updateProduct = useUpdateProduct(product?.id || "")
  const syncVariantConfiguration = useSyncProductVariantConfiguration(product?.id || "")
  const { data: categoriesData } = useCategories()
  const { data: brandsData } = useBrands({ limit: 100 })
  const linkProductBrand = useLinkProductBrand()
  const unlinkProductBrand = useUnlinkProductBrand()
  const { data: tagsData } = useTags({ limit: 100 })
  const linkProductTag = useLinkProductTag()
  const unlinkProductTag = useUnlinkProductTag()
  const linkProductCategory = useLinkProductCategory()
  const unlinkProductCategory = useUnlinkProductCategory()
  const { data: stockLocationsData } = useStockLocations()
  const {
    data: shippingOptionsData,
    isLoading: isLoadingShippingOptions,
    isFetching: isFetchingShippingOptions,
    isError: isShippingOptionsError,
    refetch: refetchShippingOptions,
  } = useShippingOptions({ limit: 100 })
  const {
    data: productShippingOptionsData,
    isLoading: isLoadingProductShippingOptions,
    isFetching: isFetchingProductShippingOptions,
    isError: isProductShippingOptionsError,
    refetch: refetchProductShippingOptions,
  } = useProductShippingOptions(product?.id)
  const syncProductShippingOptions = useSyncProductShippingOptions()

  const categories = categoriesData?.product_categories ?? []
  const brands = brandsData?.brands ?? []
  const allTags = tagsData?.tags ?? []
  const shippingOptions = shippingOptionsData?.shipping_options ?? []

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
        category_ids: product.categories?.map((c) => c.id) || [],
        brand_id: resolveBrand(product.brand)?.id || "",
        tag_ids: product.custom_tags?.map((t) => t.id) || [],
        shipping_option_ids: [],
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
        category_ids: [],
        brand_id: "",
        tag_ids: [],
        shipping_option_ids: [],
      }

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues,
  })

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control, name: "images" })

  const [submitError, setSubmitError] = React.useState<Error | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const watchedTitle = watch("title")
  const [variantConfiguration, setVariantConfiguration] =
    React.useState<ProductVariantConfiguration>(() =>
      product
        ? initializeProductVariantConfiguration(product)
        : createDefaultProductVariantConfiguration("")
    )
  const [pendingSubmit, setPendingSubmit] = React.useState<ProductFormData | null>(null)
  const [blockedVariantDelete, setBlockedVariantDelete] =
    React.useState<BlockedVariantDelete | null>(null)

  const initializeProductShippingOptions = React.useCallback(
    (ids: string[]) => {
      setValue("shipping_option_ids", ids, {
        shouldDirty: false,
        shouldValidate: true,
      })
    },
    [setValue]
  )
  const productShippingOptionsInitialized =
    useProductShippingOptionsInitialization({
      productId: product?.id,
      associationIds: productShippingOptionsData?.shipping_option_ids,
      isFieldDirty: Boolean(dirtyFields.shipping_option_ids),
      onInitialize: initializeProductShippingOptions,
    })
  const hasShippingOptionsResponse = shippingOptionsData !== undefined
  const hasProductShippingOptionsResponse =
    productShippingOptionsData !== undefined
  const shippingOptionsRequestFailed =
    isShippingOptionsError &&
    !isFetchingShippingOptions &&
    !hasShippingOptionsResponse
  const productShippingOptionsRequestFailed =
    mode === "edit" &&
    isProductShippingOptionsError &&
    !isFetchingProductShippingOptions &&
    !hasProductShippingOptionsResponse &&
    !productShippingOptionsInitialized
  const shippingOptionFieldError =
    shippingOptionsRequestFailed || productShippingOptionsRequestFailed
  const shippingOptionFieldLoading =
    (!hasShippingOptionsResponse &&
      (isLoadingShippingOptions ||
        isFetchingShippingOptions ||
        !isShippingOptionsError)) ||
    (mode === "edit" &&
      !productShippingOptionsInitialized &&
      (isLoadingProductShippingOptions ||
        isFetchingProductShippingOptions ||
        !isProductShippingOptionsError))
  const shippingOptionFieldBlocked =
    shippingOptionFieldLoading || shippingOptionFieldError
  const retryShippingOptionField = React.useCallback(() => {
    if (shippingOptionsRequestFailed) {
      void refetchShippingOptions()
    }
    if (productShippingOptionsRequestFailed) {
      void refetchProductShippingOptions()
    }
  }, [
    productShippingOptionsRequestFailed,
    refetchProductShippingOptions,
    refetchShippingOptions,
    shippingOptionsRequestFailed,
  ])

  // Media Picker state
  const [thumbnailPickerOpen, setThumbnailPickerOpen] = React.useState(false)
  const [imagesPickerOpen, setImagesPickerOpen] = React.useState(false)

  // SEO state – stored in product.metadata.seo
  const [seoData, setSeoData] = React.useState<SeoData>(() => {
    const seo = product?.metadata?.seo as SeoData | undefined
    return {
      meta_title: seo?.meta_title ?? "",
      meta_description: seo?.meta_description ?? "",
      og_image: seo?.og_image ?? "",
      keywords: seo?.keywords ?? "",
    }
  })

  // Attributes state – stored in product.metadata.attributes
  const [attributesData, setAttributesData] = React.useState<AttributeItem[]>(
    () => {
      const attrs = product?.metadata?.attributes as
        | AttributeItem[]
        | undefined
      return Array.isArray(attrs) ? attrs : []
    }
  )

  const onSubmit = async (
    data: ProductFormData,
    configuration = variantConfiguration,
    presentError = true
  ): Promise<Error | null> => {
    setIsSaving(true)
    try {
      setSubmitError(null)
      if (shippingOptionFieldBlocked) {
        throw new Error(t("form.shippingOptionsUnavailable"))
      }
      // Build the API payload
      // Auto-generate a URL-safe handle if the user left it blank or it
      // contains non-URL-safe characters (e.g. Chinese, special symbols).
      const rawHandle = data.handle?.trim() || ""
      const isUrlSafe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawHandle)
      const handle = rawHandle && isUrlSafe ? rawHandle : toSlug(data.title) || `product-${Date.now()}`
      const defaultLocation =
        stockLocationsData?.stock_locations?.[0] ||
        (await fetchStockLocations().catch(() => undefined))
          ?.stock_locations?.[0]
      const configurationErrors = getConfigurationErrors(configuration)
      if (configurationErrors.length > 0) {
        throw new Error(configurationErrors.join("；"))
      }
      const retainedVariants = configuration.variants.filter(
        (variant) => variant.status !== "delete"
      )
      const optionTitleByKey = new Map(
        configuration.options.map((option) => [option.key, option.title.trim()])
      )
      const optionValueByKey = new Map(
        configuration.options.flatMap((option) =>
          option.values.map((value) => [`${option.key}:${value.key}`, value.value.trim()] as const)
        )
      )
      const getOptionsPayload = (optionValues: Record<string, string>) =>
        Object.fromEntries(
          configuration.options.map((option) => [
            optionTitleByKey.get(option.key)!,
            optionValueByKey.get(`${option.key}:${optionValues[option.key]}`)!,
          ])
        )

      const payload: Record<string, any> = {
        title: data.title,
        subtitle: data.subtitle || undefined,
        description: data.description || undefined,
        handle,
        status: data.status,
        thumbnail: data.thumbnail || undefined,
        images: data.images.length > 0 ? data.images : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        length: data.length ? Number(data.length) : undefined,
        height: data.height ? Number(data.height) : undefined,
        width: data.width ? Number(data.width) : undefined,
        metadata: {
          ...(product?.metadata ?? {}),
          seo: seoData,
          attributes: attributesData,
        },
      }

      if (mode === "create") {
        // Include categories in create payload (Medusa supports it on create)
        if (data.category_ids.length > 0) {
          payload.categories = data.category_ids.map((id) => ({ id }))
        }

        payload.options = configuration.options.map((option) => ({
          title: option.title.trim(),
          values: option.values.map((value) => value.value.trim()),
        }))
        payload.variants = retainedVariants.map((variant) => ({
          title: variant.title.trim(),
          sku: variant.sku.trim(),
          prices: [{
            amount: Math.round(variant.price * 100),
            currency_code: variant.currency_code,
          }],
          manage_inventory: variant.manage_inventory,
          options: getOptionsPayload(variant.option_values),
          metadata:
            variant.status === "stopped"
              ? { sales_disabled: true, sales_disabled_at: new Date().toISOString() }
              : undefined,
        }))

        const result = await createProduct.mutateAsync(
          await withDefaultShippingProfile(payload)
        )
        const newProductId = result?.product?.id
        if (!newProductId) {
          throw new Error("Created product ID was not returned by the API")
        }
        try {
          await syncProductShippingOptions.mutateAsync({
            productId: newProductId,
            shippingOptionIds: data.shipping_option_ids,
          })
        } catch (error) {
          await deleteProduct.mutateAsync(newProductId).catch(() => undefined)
          throw error
        }
        const createdVariants = newProductId
          ? (await fetchProductInventorySnapshot(newProductId)).product
              .variants || []
          : result?.product?.variants || []
        if (newProductId) {
          for (const formVariant of retainedVariants) {
            if (!formVariant.manage_inventory) continue
            const createdVariant = createdVariants.find(
              (variant) => variant.sku === formVariant.sku.trim()
            )
            if (!createdVariant) continue

            await ensureInventoryForVariant({
              variantId: createdVariant.id,
              productId: newProductId,
              sku: formVariant.sku,
              title: formVariant.title,
              productTitle: data.title,
              locationId: defaultLocation?.id,
              stockedQuantity: formVariant.inventory_quantity,
              syncStockedQuantity: true,
            })
          }
        }

        // Link brand to product if selected
        if (data.brand_id && newProductId) {
          await linkProductBrand.mutateAsync({
            product_id: newProductId,
            brand_id: data.brand_id,
          })
        }

        // Link tags to product
        if (data.tag_ids.length > 0 && newProductId) {
          for (const tagId of data.tag_ids) {
            await linkProductTag.mutateAsync({
              product_id: newProductId,
              tag_id: tagId,
            })
          }
        }
      } else {
        const hasShippingProfile = Boolean(
          product?.shipping_profile?.id ?? product?.shipping_profile_id
        )
        const payloadWithShippingProfile = hasShippingProfile
          ? payload
          : await withDefaultShippingProfile(payload)

        if (!product?.id) throw new Error("Product ID is required")
        await syncVariantConfiguration.mutateAsync({
          expected_updated_at: product.updated_at,
          options: configuration.options.map((option) => ({
            key: option.key,
            id: option.id,
            title: option.title.trim(),
            values: option.values.map((value) => ({
              key: value.key,
              id: value.id,
              value: value.value.trim(),
            })),
          })),
          variants: configuration.variants.map((variant) => ({
            key: variant.key,
            id: variant.id,
            title: variant.title.trim(),
            sku: variant.sku.trim(),
            prices: [{
              amount: Math.round(variant.price * 100),
              currency_code: variant.currency_code,
            }],
            manage_inventory: variant.manage_inventory,
            option_values: variant.option_values,
            status: variant.status,
          })),
        })
        await updateProduct.mutateAsync(payloadWithShippingProfile)
        await syncProductShippingOptions.mutateAsync({
          productId: product.id,
          shippingOptionIds: data.shipping_option_ids,
        })

        const refreshedVariants = (
          await fetchProductInventorySnapshot(product.id)
        ).product.variants || []
        for (const formVariant of retainedVariants) {
          if (!formVariant.manage_inventory) continue
          const persisted = refreshedVariants.find(
            (variant) => variant.sku === formVariant.sku.trim()
          )
          if (!persisted) continue
          await ensureInventoryForVariant({
            variantId: persisted.id,
            productId: product.id,
            sku: formVariant.sku,
            title: formVariant.title,
            productTitle: data.title,
            locationId: defaultLocation?.id,
            stockedQuantity: formVariant.inventory_quantity,
            syncStockedQuantity: !formVariant.id,
          })
        }

        // Handle brand link changes
        const oldBrandId = resolveBrand(product?.brand)?.id
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

        // Handle tag link changes
        const oldTagIds = product?.custom_tags?.map((t) => t.id) || []
        const newTagIds = data.tag_ids

        // Unlink removed tags
        for (const tagId of oldTagIds) {
          if (!newTagIds.includes(tagId) && product?.id) {
            await unlinkProductTag.mutateAsync({
              product_id: product.id,
              tag_id: tagId,
            })
          }
        }

        // Link new tags
        for (const tagId of newTagIds) {
          if (!oldTagIds.includes(tagId) && product?.id) {
            await linkProductTag.mutateAsync({
              product_id: product.id,
              tag_id: tagId,
            })
          }
        }

        // Handle category link changes
        const oldCategoryIds = product?.categories?.map((c) => c.id) || []
        const newCategoryIds = data.category_ids

        // Unlink removed categories
        for (const catId of oldCategoryIds) {
          if (!newCategoryIds.includes(catId) && product?.id) {
            await unlinkProductCategory.mutateAsync({
              category_id: catId,
              product_id: product.id,
            })
          }
        }

        // Link new categories
        for (const catId of newCategoryIds) {
          if (!oldCategoryIds.includes(catId) && product?.id) {
            await linkProductCategory.mutateAsync({
              category_id: catId,
              product_id: product.id,
            })
          }
        }
      }

      router.push(returnTo)
      return null
    } catch (err) {
      const error = err instanceof Error ? err : new Error(t("errorOccurred"))
      setSubmitError(error)
      if (presentError) {
        const blockedError = getBlockedVariantDeleteError(error)
        if (blockedError) {
          setBlockedVariantDelete({ data, error: blockedError })
        } else {
          toast.error(error.message)
        }
      }
      return error
    } finally {
      setIsSaving(false)
    }
  }

  const requestSubmit = (data: ProductFormData) => {
    const configurationErrors = getConfigurationErrors(variantConfiguration)
    if (configurationErrors.length > 0) {
      setSubmitError(new Error(configurationErrors.join("；")))
      return
    }
    const summary = getConfigurationChangeSummary(variantConfiguration)
    if (
      mode === "edit" &&
      (summary.stop.length > 0 ||
        summary.restore.length > 0 ||
        summary.delete.length > 0)
    ) {
      setPendingSubmit(data)
      return
    }
    void onSubmit(data)
  }

  const stopBlockedVariantAndSave = async () => {
    if (!blockedVariantDelete) return

    const nextConfiguration = stopPendingDeleteVariant(
      variantConfiguration,
      blockedVariantDelete.error.variantId!
    )
    if (!nextConfiguration) {
      setBlockedVariantDelete((current) =>
        current
          ? {
              ...current,
              retryError: new Error(t("variantEditor.blockedVariantNotFound")),
            }
          : current
      )
      return
    }

    setVariantConfiguration(nextConfiguration)
    setBlockedVariantDelete((current) =>
      current ? { ...current, retryError: undefined } : current
    )
    const error = await onSubmit(
      blockedVariantDelete.data,
      nextConfiguration,
      false
    )
    if (!error) {
      setBlockedVariantDelete(null)
      return
    }

    const nextBlockedError = getBlockedVariantDeleteError(error)
    if (nextBlockedError) {
      setBlockedVariantDelete({
        data: blockedVariantDelete.data,
        error: nextBlockedError,
      })
      return
    }

    setBlockedVariantDelete((current) =>
      current ? { ...current, retryError: error } : current
    )
  }

  const changeSummary = getConfigurationChangeSummary(variantConfiguration)

  const mutationError =
    submitError ||
    (mode === "create" ? createProduct.error : updateProduct.error) ||
    syncVariantConfiguration.error

  return (
    <form onSubmit={handleSubmit(requestSubmit)} className="space-y-8">
      {/* Header — sticky so the save button is always reachable */}
      <div className="sticky top-0 z-20 -mx-8 -mt-8 px-8 pt-6 pb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={returnTo}>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                aria-label={t("back")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {mode === "create" ? t("createProduct") : t("editProduct")}
              </h1>
              <p className="text-muted-foreground">
                {mode === "create"
                  ? t("createSubtitle")
                  : t("editSubtitle", { name: product?.title ?? "" })}
              </p>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || isSaving || shippingOptionFieldBlocked}
          >
            {isSubmitting || isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === "create" ? t("createProduct") : t("saveChanges")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error */}
      {mutationError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-destructive/10 p-4 text-sm text-destructive"
        >
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
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">{t("form.subtitleLabel")}</Label>
              <Input
                id="subtitle"
                {...register("subtitle")}
                placeholder={t("form.subtitlePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("form.descriptionLabel")}</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    content={field.value || ""}
                    onChange={field.onChange}
                    placeholder={t("form.descriptionPlaceholder")}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">{t("form.handleLabel")}</Label>
              <Input
                id="handle"
                {...register("handle")}
                placeholder={t("form.handlePlaceholder")}
              />
            </div>
          </div>

          {/* Media */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("form.media")}</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImagesPickerOpen(true)}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {t("form.browseMedia")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendImage({ url: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("form.addUrl")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">{t("form.thumbnailUrl")}</Label>
              <div className="flex gap-2">
                <Input
                  id="thumbnail"
                  {...register("thumbnail")}
                  placeholder={t("form.thumbnailPlaceholder")}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setThumbnailPickerOpen(true)}
                  className="flex-shrink-0"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
              {errors.thumbnail && (
                <p className="text-sm text-destructive">
                  {errors.thumbnail.message}
                </p>
              )}
            </div>

            {imageFields.length > 0 && (
              <div className="space-y-3">
                <Label>{t("form.additionalImages")}</Label>
                {imageFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      {...register(`images.${index}.url`)}
                      placeholder={t("form.imageUrlPlaceholder")}
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

          {/* Thumbnail Media Picker */}
          <MediaPicker
            open={thumbnailPickerOpen}
            onOpenChange={setThumbnailPickerOpen}
            selectedUrls={watch("thumbnail") ? [watch("thumbnail") as string] : []}
            onSelect={(urls) => {
              if (urls.length > 0) {
                setValue("thumbnail", urls[0], { shouldValidate: true })
              }
            }}
          />

          {/* Images Media Picker */}
          <MediaPicker
            open={imagesPickerOpen}
            onOpenChange={setImagesPickerOpen}
            multiple
            selectedUrls={imageFields.map((f) => (f as any).url || "")}
            onSelect={(urls) => {
              // Add new image URLs that aren't already in the list
              const existingUrls = imageFields.map((f) => (f as any).url || "")
              urls.forEach((url) => {
                if (!existingUrls.includes(url)) {
                  appendImage({ url })
                }
              })
            }}
          />

          <ProductVariantEditor
            value={variantConfiguration}
            onChange={setVariantConfiguration}
            productTitle={watchedTitle}
            mode={mode}
          />

          {/* SEO */}
          <SeoEditor
            value={seoData}
            onChange={setSeoData}
            autoTitle={watch("title")}
            autoDescription={watch("description")}
            slug={watch("handle")}
          />

          {/* Product Attributes */}
          <ProductAttributesEditor
            value={attributesData}
            onChange={setAttributesData}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.status")}</h2>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <option value="draft">{t("statusOptions.draft")}</option>
                  <option value="proposed">{t("statusOptions.proposed")}</option>
                  <option value="published">{t("statusOptions.published")}</option>
                  <option value="rejected">{t("statusOptions.rejected")}</option>
                </Select>
              )}
            />
          </div>

          {/* Shipping options */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-semibold">
                {t("form.shippingOptions")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("form.shippingOptionsHint")}
              </p>
            </div>
            {shippingOptionFieldLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("form.loadingShippingOptions")}
              </p>
            )}
            {shippingOptionFieldError && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-destructive">
                  {t("form.shippingOptionsLoadFailed")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    isFetchingShippingOptions ||
                    isFetchingProductShippingOptions
                  }
                  onClick={retryShippingOptionField}
                >
                  {t("form.retryShippingOptions")}
                </Button>
              </div>
            )}
            {!shippingOptionFieldLoading &&
            !shippingOptionFieldError &&
            shippingOptions.length === 0 ? (
              <p className="text-sm text-destructive">
                {t("form.noShippingOptions")}
              </p>
            ) : shippingOptions.length > 0 ? (
              <Controller
                name="shipping_option_ids"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start gap-3 rounded-md border p-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4"
                          checked={(field.value || []).includes(option.id)}
                          disabled={shippingOptionFieldBlocked}
                          onBlur={field.onBlur}
                          onChange={(event) => {
                            setValue(
                              "shipping_option_ids",
                              toggleShippingOptionId(
                                field.value || [],
                                option.id,
                                event.target.checked
                              ),
                              {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              }
                            )
                          }}
                        />
                        <span>
                          <span className="block font-medium">{option.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.metadata?.type === "pickup"
                              ? t("form.pickupOption")
                              : t("form.deliveryOption")}
                          </span>
                        </span>
                      </label>
                    ))}
                    {errors.shipping_option_ids && (
                      <p className="text-xs text-destructive">
                        {t("form.shippingOptionsRequired")}
                      </p>
                    )}
                  </div>
                )}
              />
            ) : null}
          </div>

          {/* Brand */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.brand")}</h2>
            <Controller
              control={control}
              name="brand_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <option value="">{t("form.noBrand")}</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>

          {/* Tags */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.tags")}</h2>
            {allTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("form.noTags")}
              </p>
            ) : (
              <Controller
                name="tag_ids"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {field.value.map((tagId) => {
                          const tag = allTags.find((t) => t.id === tagId)
                          return (
                            <Badge
                              key={tagId}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() =>
                                field.onChange(
                                  field.value.filter((id) => id !== tagId)
                                )
                              }
                            >
                              {tag?.color && (
                                <span
                                  className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 flex-shrink-0"
                                  style={{ backgroundColor: tag.color }}
                                />
                              )}
                              {tag?.name || tagId}
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
                      <option value="">{t("form.selectTag")}</option>
                      {allTags
                        .filter((t) => !field.value.includes(t.id))
                        .map((tag) => (
                          <option key={tag.id} value={tag.id}>
                            {tag.name}
                          </option>
                        ))}
                    </Select>
                  </div>
                )}
              />
            )}
          </div>

          {/* Categories */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.categories")}</h2>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("form.noCategories")}
              </p>
            ) : (
              <Controller
                name="category_ids"
                control={control}
                render={({ field }) => (
                  <CategoryTreeSelect
                    categories={categories}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("form.selectCategory")}
                  />
                )}
              />
            )}
          </div>

        </div>
      </div>

      <Dialog open={!!pendingSubmit} onOpenChange={(open) => !open && setPendingSubmit(null)}>
        <DialogContent onClose={() => setPendingSubmit(null)}>
          <DialogHeader>
            <DialogTitle>{t("variantEditor.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("variantEditor.confirmDescription")}</DialogDescription>
          </DialogHeader>
          <div className="my-5 max-h-72 space-y-4 overflow-y-auto text-sm">
            {changeSummary.stop.length > 0 && (
              <div>
                <p className="font-medium">{t("variantEditor.stop")}</p>
                {changeSummary.stop.map((variant) => (
                  <p key={variant.key} className="text-muted-foreground">
                    {variant.title} ({variant.sku})
                  </p>
                ))}
              </div>
            )}
            {changeSummary.restore.length > 0 && (
              <div>
                <p className="font-medium">{t("variantEditor.restore")}</p>
                {changeSummary.restore.map((variant) => (
                  <p key={variant.key} className="text-muted-foreground">
                    {variant.title} ({variant.sku})
                  </p>
                ))}
              </div>
            )}
            {changeSummary.delete.length > 0 && (
              <div className="border border-destructive/30 bg-destructive/5 p-3">
                <p className="font-medium text-destructive">
                  {t("variantEditor.permanentDelete")}
                </p>
                {changeSummary.delete.map((variant) => (
                  <p key={variant.key} className="text-muted-foreground">
                    {variant.title} ({variant.sku})
                  </p>
                ))}
                <p className="mt-2 text-xs text-destructive">
                  {t("variantEditor.deleteWarning")}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingSubmit(null)}>
              {t("variantEditor.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const data = pendingSubmit
                setPendingSubmit(null)
                if (data) void onSubmit(data)
              }}
            >
              {t("variantEditor.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!blockedVariantDelete}
        onOpenChange={(open) => {
          if (!open && !isSaving) setBlockedVariantDelete(null)
        }}
      >
        <DialogContent
          onClose={() => {
            if (!isSaving) setBlockedVariantDelete(null)
          }}
        >
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 sm:mx-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="mt-4">
              {t("variantEditor.deleteBlockedTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("variantEditor.deleteBlockedDescription", {
                sku: blockedVariantDelete?.error.sku || "-",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{blockedVariantDelete?.error.message}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("variantEditor.deleteBlockedHint")}
            </p>
            {blockedVariantDelete?.retryError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {t("variantEditor.stopAndSaveFailed", {
                  message: blockedVariantDelete.retryError.message,
                })}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBlockedVariantDelete(null)}
              disabled={isSaving}
            >
              {t("variantEditor.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void stopBlockedVariantAndSave()}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("variantEditor.stopAndSaving")}
                </>
              ) : (
                t("variantEditor.stopAndSave")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}

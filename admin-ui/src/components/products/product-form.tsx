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
  useUpdateVariant,
  useCreateVariant,
  useCreateProductOption,
  useUpdateProductOption,
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
  Trash2,
  X,
  ImageIcon,
  Save,
  Loader2,
  FolderOpen,
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

/** brand field may be a single object or an array (due to isList link) */
function resolveBrand(brand: Product["brand"]): { id: string; name: string } | null {
  if (!brand) return null
  if (Array.isArray(brand)) return brand[0] ?? null
  return brand
}

const variantSchema = z.object({
  id: z.string().optional(),
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
  tag_ids: z.array(z.string()),
  shipping_option_ids: productShippingOptionIdsSchema,
})

type ProductFormData = z.infer<typeof productSchema>
type ProductFormVariant = ProductFormData["variants"][number]
type OptionDefinition = { title: string; values: string[] }

const DEFAULT_OPTION_TITLE = "Default option"
const DEFAULT_OPTION_VALUE = "Default"
const SKU_FALLBACK_PREFIX = "SKU"

function getSkuPart(value?: string | null) {
  return toSlug(value || "")
    .toUpperCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12)
    .replace(/-$/g, "")
}

function generateVariantSku(
  productTitle: string | undefined,
  variantTitle: string | undefined,
  variantIndex: number,
  usedSkus: Set<string>
) {
  const productPart = getSkuPart(productTitle)
  const variantPart = getSkuPart(variantTitle)
  const baseParts = [
    productPart || SKU_FALLBACK_PREFIX,
    variantPart || `VAR${variantIndex + 1}`,
  ]
  const base = baseParts.join("-").slice(0, 28)
  let candidate = base
  let suffix = 2

  while (usedSkus.has(candidate)) {
    const suffixText = `-${suffix}`
    candidate = `${base.slice(0, 32 - suffixText.length)}${suffixText}`
    suffix += 1
  }

  usedSkus.add(candidate)
  return candidate
}

function generateVariantSkus(
  productTitle: string | undefined,
  variants: ProductFormVariant[]
) {
  const usedSkus = new Set<string>()
  return variants.map((variant, index) =>
    generateVariantSku(productTitle, variant.title, index, usedSkus)
  )
}

function getExistingSkuSet(variants: ProductFormVariant[]) {
  return new Set(
    variants
      .map((variant) => variant.sku?.trim())
      .filter((sku): sku is string => !!sku)
  )
}

function splitOptionValues(values: string) {
  return values
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}

function dedupeValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function getProductOptionValues(option: NonNullable<Product["options"]>[number]) {
  return option.values?.map((value) => value.value).filter(Boolean) || []
}

function splitVariantTitle(title: string) {
  return title
    .split("/")
    .map((value) => value.trim())
    .filter(Boolean)
}

function getVariantOptionAssignments(
  variant: ProductFormVariant,
  variantIndex: number,
  options: Array<{ title: string; values: string[] }>
) {
  if (options.length === 0) {
    return { [DEFAULT_OPTION_TITLE]: DEFAULT_OPTION_VALUE }
  }

  const titleParts = splitVariantTitle(variant.title)

  return options.reduce<Record<string, string>>((assignments, option, optionIndex) => {
    const optionValues = option.values
    let value = titleParts[optionIndex]

    if (options.length === 1) {
      const titleValue = variant.title.trim()
      value =
        optionValues.find((optionValue) => optionValue === titleValue) ||
        optionValues[variantIndex] ||
        titleValue ||
        optionValues[0]
    }

    value =
      value ||
      optionValues[variantIndex] ||
      optionValues[0] ||
      (optionIndex === 0 ? variant.title.trim() : option.title)

    assignments[option.title] = value
    return assignments
  }, {})
}

function buildVariantCreatePayload(
  variant: ProductFormVariant,
  options: Record<string, string>
) {
  return {
    title: variant.title,
    sku: variant.sku?.trim() || undefined,
    prices: [
      {
        amount: Math.round(variant.price * 100),
        currency_code: variant.currency_code,
      },
    ],
    manage_inventory: variant.manage_inventory,
    options,
  }
}

function findCreatedVariant<T extends { id: string; title: string; sku?: string | null }>(
  variants: T[],
  variant: ProductFormVariant,
  usedVariantIds: Set<string>
) {
  const sku = variant.sku?.trim()

  if (sku) {
    const bySku = variants.find((item) => item.sku === sku && !usedVariantIds.has(item.id))
    if (bySku) return bySku
  }

  const byTitle = variants.find(
    (item) => item.title === variant.title && !usedVariantIds.has(item.id)
  )
  if (byTitle) return byTitle

  return variants.find((item) => !usedVariantIds.has(item.id))
}

function expandOptionDefinitions(
  options: OptionDefinition[],
  assignments: Record<string, string>[]
) {
  return options.map((option) => ({
    ...option,
    values: dedupeValues([
      ...option.values,
      ...assignments
        .map((assignment) => assignment[option.title])
        .filter(Boolean),
    ]),
  }))
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
  const updateVariant = useUpdateVariant(product?.id || "")
  const createVariant = useCreateVariant(product?.id || "")
  const createProductOption = useCreateProductOption(product?.id || "")
  const updateProductOption = useUpdateProductOption(product?.id || "")
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
        options:
          product.options?.map((o) => ({
            title: o.title,
            values: o.values?.map((v) => v.value).join(", ") || "",
          })) || [],
        variants:
          product.variants?.map((v) => ({
            id: v.id,
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
        options: [],
        variants: [
          {
            id: undefined,
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
    getValues,
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
  } = useFieldArray({ control, name: "variants", keyName: "fieldId" })

  const [submitError, setSubmitError] = React.useState<Error | null>(null)
  const manuallyEditedSkuFieldIds = React.useRef<Set<string>>(new Set())
  const lastAutoSkusByFieldId = React.useRef<Map<string, string>>(new Map())
  const watchedTitle = watch("title")
  const watchedVariants = watch("variants")

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

  React.useEffect(() => {
    const currentVariants = getValues("variants") || []
    const autoSkus = generateVariantSkus(watchedTitle, currentVariants)
    const activeFieldIds = new Set(variantFields.map((field) => field.fieldId))

    for (const fieldId of Array.from(manuallyEditedSkuFieldIds.current)) {
      if (!activeFieldIds.has(fieldId)) {
        manuallyEditedSkuFieldIds.current.delete(fieldId)
      }
    }

    for (const fieldId of Array.from(lastAutoSkusByFieldId.current.keys())) {
      if (!activeFieldIds.has(fieldId)) {
        lastAutoSkusByFieldId.current.delete(fieldId)
      }
    }

    variantFields.forEach((field, index) => {
      const formVariant = currentVariants[index]
      if (!formVariant) return
      if (mode === "edit" && formVariant.id) return
      if (manuallyEditedSkuFieldIds.current.has(field.fieldId)) return

      const nextSku = autoSkus[index]
      const currentSku = formVariant.sku?.trim() || ""
      const previousAutoSku =
        lastAutoSkusByFieldId.current.get(field.fieldId) || ""

      if (!currentSku || currentSku === previousAutoSku) {
        if (currentSku !== nextSku) {
          setValue(`variants.${index}.sku`, nextSku, {
            shouldDirty: false,
            shouldValidate: true,
          })
        }
        lastAutoSkusByFieldId.current.set(field.fieldId, nextSku)
      }
    })
  }, [getValues, mode, setValue, variantFields, watchedTitle, watchedVariants])

  const buildFormOptionDefinitions = (data: ProductFormData): OptionDefinition[] => {
    if (data.options.length > 0) {
      return data.options.map((option) => {
        const values = splitOptionValues(option.values)
        return {
          title: option.title,
          values: values.length > 0 ? values : [option.title],
        }
      })
    }

    if (product?.options && product.options.length > 0) {
      return product.options.map((option) => {
        const values = getProductOptionValues(option)
        return {
          title: option.title,
          values: values.length > 0 ? values : [DEFAULT_OPTION_VALUE],
        }
      })
    }

    return [{ title: DEFAULT_OPTION_TITLE, values: [DEFAULT_OPTION_VALUE] }]
  }

  const ensureProductOptionValues = async (optionDefinitions: OptionDefinition[]) => {
    if (!product?.id) return

    const currentOptions = new Map(
      (product.options || []).map((option) => [
        option.title,
        {
          id: option.id,
          title: option.title,
          values: getProductOptionValues(option),
        },
      ])
    )

    for (const optionDefinition of optionDefinitions) {
      const values =
        optionDefinition.values.length > 0
          ? optionDefinition.values
          : [DEFAULT_OPTION_VALUE]
      const existingOption = currentOptions.get(optionDefinition.title)

      if (!existingOption) {
        await createProductOption.mutateAsync({
          title: optionDefinition.title,
          values,
        })
        currentOptions.set(optionDefinition.title, {
          id: "",
          title: optionDefinition.title,
          values,
        })
        continue
      }

      const nextValues = dedupeValues([...existingOption.values, ...values])
      if (nextValues.length === existingOption.values.length) continue

      await updateProductOption.mutateAsync({
        optionId: existingOption.id,
        data: {
          title: existingOption.title,
          values: nextValues,
        },
      })
      currentOptions.set(optionDefinition.title, {
        ...existingOption,
        values: nextValues,
      })
    }
  }

  const getSubmitVariants = (variants: ProductFormVariant[]) => {
    const autoSkus = generateVariantSkus(watchedTitle, variants)

    return variants.map((variant, index) => {
      const fieldId = variantFields[index]?.fieldId
      if (mode === "edit" && variant.id) return variant
      if (fieldId && manuallyEditedSkuFieldIds.current.has(fieldId)) {
        return { ...variant, sku: variant.sku?.trim() || "" }
      }

      const currentSku = variant.sku?.trim() || ""
      const previousAutoSku = fieldId
        ? lastAutoSkusByFieldId.current.get(fieldId) || ""
        : ""
      const nextSku =
        !currentSku || currentSku === previousAutoSku
          ? autoSkus[index]
          : currentSku

      return { ...variant, sku: nextSku }
    })
  }

  const onSubmit = async (data: ProductFormData) => {
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
      const submitData = {
        ...data,
        variants: getSubmitVariants(data.variants),
      }

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
        const baseOptionDefinitions = buildFormOptionDefinitions(data)
        const variantOptionAssignments = submitData.variants.map((variant, index) =>
          getVariantOptionAssignments(variant, index, baseOptionDefinitions)
        )
        const optionDefinitions = expandOptionDefinitions(
          baseOptionDefinitions,
          variantOptionAssignments
        )

        // Include categories in create payload (Medusa supports it on create)
        if (data.category_ids.length > 0) {
          payload.categories = data.category_ids.map((id) => ({ id }))
        }

        // Medusa v2 requires every variant to reference valid option values.
        payload.options = optionDefinitions.map((option) => ({
          title: option.title,
          values: option.values,
        }))
        payload.variants = submitData.variants.map((variant, index) =>
          buildVariantCreatePayload(variant, variantOptionAssignments[index])
        )

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
        const usedVariantIds = new Set<string>()

        if (newProductId) {
          for (const formVariant of submitData.variants) {
            if (!formVariant.manage_inventory) continue

            const createdVariant = findCreatedVariant(
              createdVariants,
              formVariant,
              usedVariantIds
            )
            if (!createdVariant) continue

            usedVariantIds.add(createdVariant.id)
            await ensureInventoryForVariant({
              variantId: createdVariant.id,
              productId: newProductId,
              sku: formVariant.sku || createdVariant.sku,
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

        await updateProduct.mutateAsync(payloadWithShippingProfile)
        if (product?.id) {
          await syncProductShippingOptions.mutateAsync({
            productId: product.id,
            shippingOptionIds: data.shipping_option_ids,
          })
        }

        if (product?.id && submitData.variants) {
          const baseOptionDefinitions = buildFormOptionDefinitions(data)
          const existingVariantsById = new Map(
            (product.variants || []).map((variant) => [variant.id, variant])
          )
          const variantsToCreate = submitData.variants
            .map((formVariant, index) => ({
              formVariant,
              index,
              existingVariant: formVariant.id
                ? existingVariantsById.get(formVariant.id)
                : undefined,
            }))
            .filter(({ formVariant, existingVariant }) => {
              return !formVariant.id || !existingVariant
            })
          const newVariantAssignments = variantsToCreate.map(({ formVariant, index }) =>
            getVariantOptionAssignments(formVariant, index, baseOptionDefinitions)
          )

          if (variantsToCreate.length > 0) {
            await ensureProductOptionValues(
              expandOptionDefinitions(baseOptionDefinitions, newVariantAssignments)
            )
          }

          const usedVariantIds = new Set(
            (product.variants || []).map((variant) => variant.id)
          )

          for (let i = 0; i < submitData.variants.length; i++) {
            const formVariant = submitData.variants[i]
            const existingVariant =
              (formVariant.id && existingVariantsById.get(formVariant.id)) ||
              undefined

            if (!existingVariant) {
              const options = getVariantOptionAssignments(
                formVariant,
                i,
                baseOptionDefinitions
              )
              const result = await createVariant.mutateAsync(
                buildVariantCreatePayload(formVariant, options)
              )
              const createdVariants =
                result.product?.variants ||
                (await fetchProductInventorySnapshot(product.id)).product
                  .variants ||
                []
              const createdVariant = findCreatedVariant(
                createdVariants,
                formVariant,
                usedVariantIds
              )

              if (!createdVariant) {
                throw new Error(`Created variant ${formVariant.title} was not returned by the API`)
              }

              usedVariantIds.add(createdVariant.id)
              if (formVariant.manage_inventory) {
                await ensureInventoryForVariant({
                  variantId: createdVariant.id,
                  productId: product.id,
                  sku: formVariant.sku || createdVariant.sku,
                  title: formVariant.title,
                  productTitle: data.title,
                  locationId: defaultLocation?.id,
                  stockedQuantity: formVariant.inventory_quantity,
                  syncStockedQuantity: true,
                })
              }
              continue
            }

            const variantPayload: Record<string, any> = {}

            if (formVariant.title !== existingVariant.title) {
              variantPayload.title = formVariant.title
            }

            const oldSku = existingVariant.sku || ""
            if (formVariant.sku !== oldSku) {
              variantPayload.sku = formVariant.sku || null
            }

            if (formVariant.manage_inventory !== (existingVariant.manage_inventory ?? true)) {
              variantPayload.manage_inventory = formVariant.manage_inventory
            }

            const oldPrice = existingVariant.prices?.[0]
            const newPriceAmount = Math.round(formVariant.price * 100)
            if (
              !oldPrice ||
              oldPrice.amount !== newPriceAmount ||
              oldPrice.currency_code !== formVariant.currency_code
            ) {
              variantPayload.prices = [
                {
                  amount: newPriceAmount,
                  currency_code: formVariant.currency_code,
                },
              ]
            }

            if (Object.keys(variantPayload).length > 0) {
              await updateVariant.mutateAsync({
                variantId: existingVariant.id,
                data: variantPayload,
              })
            }

            if (formVariant.manage_inventory) {
              await ensureInventoryForVariant({
                variantId: existingVariant.id,
                productId: product.id,
                sku: formVariant.sku || existingVariant.sku,
                title: formVariant.title,
                productTitle: data.title,
                locationId: defaultLocation?.id,
                stockedQuantity: formVariant.inventory_quantity,
                syncStockedQuantity: false,
              })
            }
          }
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
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err : new Error(t("errorOccurred"))
      )
    }
  }

  const mutationError =
    submitError ||
    (mode === "create" ? createProduct.error : updateProduct.error) ||
    updateVariant.error ||
    createVariant.error ||
    createProductOption.error ||
    updateProductOption.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
            disabled={isSubmitting || shippingOptionFieldBlocked}
          >
            {isSubmitting ? (
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

          {/* Options */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t("form.options")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("form.optionsDescription")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendOption({ title: "", values: "" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("form.addOption")}
              </Button>
            </div>

            {optionFields.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t("form.noOptions")}
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
                        <Label>{t("form.optionName")}</Label>
                        <Input
                          {...register(`options.${index}.title`)}
                          placeholder={t("form.optionNamePlaceholder")}
                        />
                        {errors.options?.[index]?.title && (
                          <p className="text-sm text-destructive">
                            {errors.options[index]?.title?.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>{t("form.optionValues")}</Label>
                        <Input
                          {...register(`options.${index}.values`)}
                          placeholder={t("form.optionValuesPlaceholder")}
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
                <h2 className="text-lg font-semibold">{t("form.variants")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("form.variantsDescription")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentVariants = getValues("variants") || []
                  const nextIndex = currentVariants.length
                  const nextSku = generateVariantSku(
                    getValues("title"),
                    "",
                    nextIndex,
                    getExistingSkuSet(currentVariants)
                  )
                  appendVariant({
                    title: "",
                    sku: nextSku,
                    price: 0,
                    currency_code: "usd",
                    inventory_quantity: 0,
                    manage_inventory: true,
                  })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("form.addVariant")}
              </Button>
            </div>

            {variantFields.map((field, index) => (
              <div
                key={field.fieldId}
                className="rounded-md border p-4 space-y-3"
              >
                <input type="hidden" {...register(`variants.${index}.id`)} />
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    {t("form.variantNumber", { number: index + 1 })}
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
                    <Label>{t("form.variantTitle")}</Label>
                    <Input
                      {...register(`variants.${index}.title`)}
                      placeholder={t("form.variantTitlePlaceholder")}
                    />
                    {errors.variants?.[index]?.title && (
                      <p className="text-sm text-destructive">
                        {errors.variants[index]?.title?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("form.variantSku")}</Label>
                    <Input
                      {...register(`variants.${index}.sku`, {
                        onChange: (event) => {
                          const fieldId = variantFields[index]?.fieldId
                          if (!fieldId) return
                          const value = event.target.value.trim()
                          const lastAuto =
                            lastAutoSkusByFieldId.current.get(fieldId) || ""
                          if (value && value !== lastAuto) {
                            manuallyEditedSkuFieldIds.current.add(fieldId)
                          } else {
                            manuallyEditedSkuFieldIds.current.delete(fieldId)
                          }
                        },
                      })}
                      placeholder={t("form.variantSkuPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("form.variantPrice")}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.price`)}
                      placeholder={t("form.variantPricePlaceholder")}
                    />
                    {errors.variants?.[index]?.price && (
                      <p className="text-sm text-destructive">
                        {errors.variants[index]?.price?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("form.variantCurrency")}</Label>
                    <Controller
                      control={control}
                      name={`variants.${index}.currency_code`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="usd">USD</option>
                          <option value="eur">EUR</option>
                          <option value="gbp">GBP</option>
                          <option value="cny">CNY</option>
                          <option value="jpy">JPY</option>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("form.variantInventory")}</Label>
                    {mode === "edit" && watch(`variants.${index}.id`) ? (
                      <div>
                        <Input
                          type="number"
                          value={
                            product?.variants?.find(
                              (variant) =>
                                variant.id === watch(`variants.${index}.id`)
                            )?.inventory_quantity ?? 0
                          }
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("form.variantInventoryHint")}
                        </p>
                      </div>
                    ) : (
                      <Input
                        type="number"
                        {...register(`variants.${index}.inventory_quantity`)}
                        placeholder="0"
                      />
                    )}
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
                      {t("form.manageInventory")}
                    </Label>
                  </div>
                </div>
              </div>
            ))}
          </div>

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

          {/* Dimensions */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("form.dimensions")}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="weight">{t("form.weight")}</Label>
                <Input
                  id="weight"
                  type="number"
                  {...register("weight")}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">{t("form.length")}</Label>
                <Input
                  id="length"
                  type="number"
                  {...register("length")}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">{t("form.width")}</Label>
                <Input
                  id="width"
                  type="number"
                  {...register("width")}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">{t("form.height")}</Label>
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

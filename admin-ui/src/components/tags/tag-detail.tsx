"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Tag, useTag, useDeleteTag, useLinkProductTag, useUnlinkProductTag } from "@/hooks/use-tags"
import { useProducts } from "@/hooks/use-products"
import { DeleteTagDialog } from "./delete-tag-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Bookmark,
  Package,
  Plus,
  X,
  Search,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface TagDetailProps {
  tagId: string
}

export function TagDetail({ tagId }: TagDetailProps) {
  const t = useTranslations("tags")
  const router = useRouter()
  const { data, isLoading, isError, error } = useTag(tagId)
  const deleteTag = useDeleteTag()
  const linkProduct = useLinkProductTag()
  const unlinkProduct = useUnlinkProductTag()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [showProductPicker, setShowProductPicker] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedQuery, setDebouncedQuery] = React.useState("")

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: productsData } = useProducts({
    q: debouncedQuery || undefined,
    limit: 20,
    fields: "id,title,status,thumbnail",
  })

  const tag = data?.tag
  const existingProductIds = new Set(tag?.products?.map((p) => p.id) || [])

  const handleDelete = async () => {
    try {
      await deleteTag.mutateAsync(tagId)
      router.push("/tags")
    } catch (err) {
      // Handled by mutation
    }
  }

  const handleLinkProduct = async (productId: string) => {
    await linkProduct.mutateAsync({ tag_id: tagId, product_id: productId })
  }

  const handleUnlinkProduct = async (productId: string) => {
    await unlinkProduct.mutateAsync({ tag_id: tagId, product_id: productId })
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !tag) {
    return (
      <div className="space-y-6">
        <Link href="/tags">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToTags")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error ? error.message : t("tagNotFound")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tags">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div
              className="h-12 w-12 rounded-full border-2 border-muted flex-shrink-0"
              style={{ backgroundColor: tag.color || "#e5e7eb" }}
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{tag.name}</h1>
              <Badge variant={tag.type === "badge" ? "default" : "secondary"}>
                {t(`typeOptions.${tag.type}`)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/tags/${tagId}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              {t("actions.edit")}
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("actions.delete")}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Tag Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              {t("detail.tagDetails")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t("detail.type")}</p>
                <Badge variant={tag.type === "badge" ? "default" : "secondary"}>
                  {t(`typeOptions.${tag.type}`)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t("detail.color")}</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: tag.color || "#e5e7eb" }} />
                  <code className="text-sm bg-muted px-2 py-0.5 rounded">{tag.color || t("detail.noColor")}</code>
                </div>
              </div>
            </div>
          </div>

          {/* Associated Products */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("detail.products")}
                {tag.products && <Badge variant="secondary">{tag.products.length}</Badge>}
              </h2>
              <Button variant="outline" size="sm" onClick={() => setShowProductPicker(true)}>
                <Plus className="mr-1 h-3 w-3" />
                {t("detail.addProduct")}
              </Button>
            </div>

            {!tag.products || tag.products.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("detail.noProducts")}</p>
            ) : (
              <div className="space-y-3">
                {tag.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-md border p-4">
                    <div className="flex items-center gap-3">
                      {product.thumbnail ? (
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                          <img src={product.thumbnail} alt={product.title} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">N/A</span>
                        </div>
                      )}
                      <div>
                        <Link href={`/products/${product.id}`} className="font-medium hover:underline text-sm">
                          {product.title}
                        </Link>
                        <p className="text-xs text-muted-foreground capitalize">{product.status}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlinkProduct(product.id)}
                      disabled={unlinkProduct.isPending}
                    >
                      <X className="mr-1 h-3 w-3" />
                      {t("detail.unlinkProduct")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("detail.quickInfo")}</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.productCount")}</span>
                <span className="text-sm font-medium">{tag.products?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.created")}</span>
                <span className="text-sm">{format(new Date(tag.created_at), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.updated")}</span>
                <span className="text-sm">{format(new Date(tag.updated_at), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("detail.tagId")}</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">{tag.id}</code>
          </div>
        </div>
      </div>

      {/* Product Picker Dialog */}
      <Dialog open={showProductPicker} onOpenChange={setShowProductPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("detail.selectProduct")}</DialogTitle>
            <DialogDescription>{t("detail.selectProductDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("detail.searchProducts")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {productsData?.products?.map((product) => {
                const isLinked = existingProductIds.has(product.id)
                return (
                  <div key={product.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      {product.thumbnail ? (
                        <div className="h-8 w-8 rounded-md overflow-hidden bg-muted">
                          <img src={product.thumbnail} alt={product.title} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">N/A</span>
                        </div>
                      )}
                      <span className="text-sm font-medium">{product.title}</span>
                    </div>
                    {isLinked ? (
                      <Badge variant="secondary">{t("detail.alreadyLinked")}</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleLinkProduct(product.id)}
                        disabled={linkProduct.isPending}
                      >
                        {linkProduct.isPending ? (
                          <><Loader2 className="mr-1 h-3 w-3 animate-spin" />{t("detail.adding")}</>
                        ) : (
                          <><Plus className="mr-1 h-3 w-3" />{t("detail.add")}</>
                        )}
                      </Button>
                    )}
                  </div>
                )
              })}
              {productsData?.products?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t("detail.noSearchResults")}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteTagDialog
        tag={tag}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={deleteTag.isPending}
      />
    </div>
  )
}

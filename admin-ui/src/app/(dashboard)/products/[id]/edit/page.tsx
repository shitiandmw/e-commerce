"use client"

import { useParams } from "next/navigation"
import { useProduct } from "@/hooks/use-products"
import { ProductForm } from "@/components/products/product-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditProductPage() {
  const params = useParams()
  const productId = params.id as string
  const { data, isLoading, isError, error } = useProduct(productId)

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data?.product) {
    return (
      <div className="space-y-6">
        <Link href="/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : "Product not found or failed to load."}
          </p>
        </div>
      </div>
    )
  }

  return <ProductForm product={data.product} mode="edit" />
}

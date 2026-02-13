"use client"

import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMenu } from "@/hooks/use-menus"
import { MenuForm } from "@/components/menus/menu-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditMenuPage() {
  const t = useTranslations("menus")
  const params = useParams()
  const menuId = params.id as string
  const { data, isLoading, isError, error } = useMenu(menuId)

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
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (isError || !data?.menu) {
    return (
      <div className="space-y-6">
        <Link href="/menus">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToMenus")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("menuNotFound")}
          </p>
        </div>
      </div>
    )
  }

  return <MenuForm menu={data.menu} mode="edit" />
}

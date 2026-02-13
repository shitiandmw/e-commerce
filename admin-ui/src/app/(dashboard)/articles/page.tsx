"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArticleTable } from "@/components/articles/article-table"
import { ArticleCategoryManager } from "@/components/articles/article-category-manager"

export default function ArticlesPage() {
  const t = useTranslations("articles")
  const [categoryManagerOpen, setCategoryManagerOpen] = React.useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ArticleTable
        onManageCategories={() => setCategoryManagerOpen(true)}
      />

      <ArticleCategoryManager
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
      />
    </div>
  )
}

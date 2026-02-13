"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useArticle, useDeleteArticle } from "@/hooks/use-articles"
import { DeleteArticleDialog } from "./delete-article-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  Calendar,
  Pin,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface ArticleDetailProps {
  articleId: string
}

export function ArticleDetail({ articleId }: ArticleDetailProps) {
  const t = useTranslations("articles")
  const router = useRouter()
  const { data, isLoading, isError, error } = useArticle(articleId)
  const deleteArticle = useDeleteArticle()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const article = data?.article

  const handleDelete = async () => {
    try {
      await deleteArticle.mutateAsync(articleId)
      router.push("/articles")
    } catch (err) {
      // Handled by mutation
    }
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
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !article) {
    return (
      <div className="space-y-6">
        <Link href="/articles">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToArticles")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("articleNotFound")}
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
          <Link href="/articles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {article.cover_image ? (
              <div className="h-12 w-12 rounded-lg border overflow-hidden bg-muted">
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg border bg-muted flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {article.title}
                </h1>
                {article.is_pinned && (
                  <Pin className="h-5 w-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">/{article.slug}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/articles/${articleId}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              {t("actions.edit")}
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("actions.delete")}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Summary */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("detail.summary")}
            </h2>
            {article.summary ? (
              <p className="text-sm whitespace-pre-wrap">{article.summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("detail.noSummary")}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("detail.content")}</h2>
            {article.content ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("detail.noContent")}
              </p>
            )}
          </div>

          {/* Cover Image */}
          {article.cover_image && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold">
                {t("form.coverImage")}
              </h2>
              <div className="rounded-md overflow-hidden border bg-muted">
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="w-full h-auto object-cover max-h-96"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("detail.quickInfo")}</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.status")}
                </span>
                <Badge
                  variant={
                    article.status === "published" ? "default" : "secondary"
                  }
                >
                  {t(`status.${article.status}`)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.category")}
                </span>
                <span className="text-sm font-medium">
                  {article.category?.name || t("detail.uncategorized")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.pinned")}
                </span>
                <span className="text-sm font-medium">
                  {article.is_pinned ? t("table.yes") : t("table.no")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.sortOrder")}
                </span>
                <span className="text-sm font-medium">
                  {article.sort_order ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.publishedAt")}
                </span>
                <span className="text-sm">
                  {article.published_at
                    ? format(
                        new Date(article.published_at),
                        "MMM d, yyyy HH:mm"
                      )
                    : t("detail.notPublished")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.created")}
                </span>
                <span className="text-sm">
                  {format(new Date(article.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.updated")}
                </span>
                <span className="text-sm">
                  {format(new Date(article.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Article ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("detail.articleId")}
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {article.id}
            </code>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteArticleDialog
        article={article}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={deleteArticle.isPending}
      />
    </div>
  )
}

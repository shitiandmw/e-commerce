"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// Types
export interface ArticleCategory {
  id: string
  name: string
  handle: string
  description?: string | null
  sort_order?: number
  created_at: string
  updated_at: string
}

export interface Article {
  id: string
  title: string
  slug: string
  cover_image?: string | null
  summary?: string | null
  content?: string | null
  status: "draft" | "published"
  published_at?: string | null
  sort_order?: number
  is_pinned?: boolean
  category_id?: string | null
  category?: ArticleCategory | null
  translations?: Record<string, { title?: string; summary?: string; content?: string }> | null
  seo?: { meta_title?: string; meta_description?: string; og_image?: string; keywords?: string } | null
  created_at: string
  updated_at: string
}

export interface ArticlesResponse {
  articles: Article[]
  count: number
  offset: number
  limit: number
}

export interface ArticleCategoriesResponse {
  article_categories: ArticleCategory[]
  count: number
  offset: number
  limit: number
}

export interface ArticlesQueryParams {
  offset?: number
  limit?: number
  q?: string
  status?: string
  category_id?: string
}

// ─── Article Hooks ───────────────────────────────────────

export function useArticles(params: ArticlesQueryParams = {}) {
  const { offset = 0, limit = 20, q, status, category_id } = params

  return useQuery<ArticlesResponse>({
    queryKey: ["articles", { offset, limit, q, status, category_id }],
    queryFn: () => {
      const queryParams: Record<string, string> = {
        offset: String(offset),
        limit: String(limit),
        fields: "id,title,slug,cover_image,summary,status,published_at,sort_order,is_pinned,category_id,category.*,translations,seo,created_at,updated_at",
      }
      if (q) queryParams.q = q
      if (status) queryParams.status = status
      if (category_id) queryParams.category_id = category_id

      return adminFetch<ArticlesResponse>("/admin/articles", {
        params: queryParams,
      })
    },
  })
}

export function useArticle(id: string) {
  return useQuery<{ article: Article }>({
    queryKey: ["article", id],
    queryFn: () => adminFetch<{ article: Article }>(`/admin/articles/${id}`),
    enabled: !!id,
  })
}

export function useCreateArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      title: string
      slug: string
      cover_image?: string
      summary?: string
      content?: string
      status?: "draft" | "published"
      published_at?: string | null
      sort_order?: number
      is_pinned?: boolean
      category_id?: string
      translations?: Record<string, any> | null
      seo?: Record<string, any> | null
    }) =>
      adminFetch<{ article: Article }>("/admin/articles", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] })
    },
  })
}

export function useUpdateArticle(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      title?: string
      slug?: string
      cover_image?: string | null
      summary?: string | null
      content?: string | null
      status?: "draft" | "published"
      published_at?: string | null
      sort_order?: number
      is_pinned?: boolean
      category_id?: string | null
      translations?: Record<string, any> | null
      seo?: Record<string, any> | null
    }) =>
      adminFetch<{ article: Article }>(`/admin/articles/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] })
      queryClient.invalidateQueries({ queryKey: ["article", id] })
    },
  })
}

export function useDeleteArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/articles/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] })
    },
  })
}

// ─── Article Category Hooks ──────────────────────────────

export function useArticleCategories() {
  return useQuery<ArticleCategoriesResponse>({
    queryKey: ["article-categories"],
    queryFn: () =>
      adminFetch<ArticleCategoriesResponse>("/admin/article-categories", {
        params: { limit: "100" },
      }),
  })
}

export function useArticleCategory(id: string) {
  return useQuery<{ article_category: ArticleCategory }>({
    queryKey: ["article-category", id],
    queryFn: () =>
      adminFetch<{ article_category: ArticleCategory }>(
        `/admin/article-categories/${id}`
      ),
    enabled: !!id,
  })
}

export function useCreateArticleCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name: string
      handle: string
      description?: string
      sort_order?: number
    }) =>
      adminFetch<{ article_category: ArticleCategory }>(
        "/admin/article-categories",
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-categories"] })
    },
  })
}

export function useUpdateArticleCategory(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name?: string
      handle?: string
      description?: string | null
      sort_order?: number
    }) =>
      adminFetch<{ article_category: ArticleCategory }>(
        `/admin/article-categories/${id}`,
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-categories"] })
      queryClient.invalidateQueries({ queryKey: ["article-category", id] })
    },
  })
}

export function useDeleteArticleCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/article-categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-categories"] })
    },
  })
}

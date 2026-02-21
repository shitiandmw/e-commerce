"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

export interface AttributeTemplate {
  id: string
  name: string
  attributes: string[]
  created_at: string
  updated_at: string
}

export interface AttributeTemplatesResponse {
  attribute_templates: AttributeTemplate[]
  count: number
  offset: number
  limit: number
}

export function useAttributeTemplates() {
  return useQuery<AttributeTemplatesResponse>({
    queryKey: ["attribute-templates"],
    queryFn: () =>
      adminFetch<AttributeTemplatesResponse>("/admin/attribute-templates", {
        params: { limit: "100" },
      }),
  })
}

export function useCreateAttributeTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; attributes: string[] }) =>
      adminFetch<{ attribute_template: AttributeTemplate }>(
        "/admin/attribute-templates",
        { method: "POST", body: data }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attribute-templates"] })
    },
  })
}

export function useDeleteAttributeTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/attribute-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attribute-templates"] })
    },
  })
}

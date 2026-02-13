"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// Types
export interface MenuItem {
  id: string
  menu_id: string
  label: string
  url: string
  icon_url?: string | null
  sort_order: number
  is_enabled: boolean
  parent_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
  children: MenuItem[]
}

export interface MenuItemFlat {
  id: string
  menu_id: string
  label: string
  url: string
  icon_url?: string | null
  sort_order: number
  is_enabled: boolean
  parent_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Menu {
  id: string
  name: string
  key: string
  description?: string | null
  items?: MenuItem[]
  created_at: string
  updated_at: string
}

export interface MenusResponse {
  menus: Menu[]
  count: number
  offset: number
  limit: number
}

export interface MenusQueryParams {
  offset?: number
  limit?: number
}

// Menu Hooks
export function useMenus(params: MenusQueryParams = {}) {
  const { offset = 0, limit = 20 } = params

  return useQuery<MenusResponse>({
    queryKey: ["menus", { offset, limit }],
    queryFn: () =>
      adminFetch<MenusResponse>("/admin/menus", {
        params: {
          offset: String(offset),
          limit: String(limit),
        },
      }),
  })
}

export function useMenu(id: string) {
  return useQuery<{ menu: Menu }>({
    queryKey: ["menu", id],
    queryFn: () => adminFetch<{ menu: Menu }>(`/admin/menus/${id}`),
    enabled: !!id,
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; key: string; description?: string }) =>
      adminFetch<{ menu: Menu }>("/admin/menus", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] })
    },
  })
}

export function useUpdateMenu(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name?: string
      key?: string
      description?: string | null
    }) =>
      adminFetch<{ menu: Menu }>(`/admin/menus/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] })
      queryClient.invalidateQueries({ queryKey: ["menu", id] })
    },
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/menus/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] })
    },
  })
}

// Menu Item Hooks
export function useMenuItems(menuId: string) {
  return useQuery<{ items: MenuItemFlat[] }>({
    queryKey: ["menu-items", menuId],
    queryFn: () =>
      adminFetch<{ items: MenuItemFlat[] }>(`/admin/menus/${menuId}/items`),
    enabled: !!menuId,
  })
}

export function useCreateMenuItem(menuId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      label: string
      url: string
      icon_url?: string
      sort_order?: number
      is_enabled?: boolean
      parent_id?: string | null
      metadata?: Record<string, unknown>
    }) =>
      adminFetch<{ item: MenuItemFlat }>(`/admin/menus/${menuId}/items`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", menuId] })
      queryClient.invalidateQueries({ queryKey: ["menu-items", menuId] })
    },
  })
}

export function useUpdateMenuItem(menuId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string
      data: {
        label?: string
        url?: string
        icon_url?: string | null
        sort_order?: number
        is_enabled?: boolean
        parent_id?: string | null
        metadata?: Record<string, unknown> | null
      }
    }) =>
      adminFetch<{ item: MenuItemFlat }>(
        `/admin/menus/${menuId}/items/${itemId}`,
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", menuId] })
      queryClient.invalidateQueries({ queryKey: ["menu-items", menuId] })
    },
  })
}

export function useDeleteMenuItem(menuId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) =>
      adminFetch(`/admin/menus/${menuId}/items/${itemId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", menuId] })
      queryClient.invalidateQueries({ queryKey: ["menu-items", menuId] })
    },
  })
}

export function useReorderMenuItems(menuId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      items: Array<{ id: string; sort_order: number; parent_id?: string | null }>
    ) =>
      adminFetch(`/admin/menus/${menuId}/reorder`, {
        method: "POST",
        body: { items },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", menuId] })
      queryClient.invalidateQueries({ queryKey: ["menu-items", menuId] })
    },
  })
}

"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"
import { getToken } from "@/lib/auth"

// Types
export interface MediaFile {
  id: string
  url: string
  key?: string
  created_at?: string
  updated_at?: string
}

export interface UploadResponse {
  files: MediaFile[]
}

// Upload files using FormData (not JSON) — cannot use adminFetch because it
// always sets Content-Type to application/json and JSON-stringifies the body.
async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const token = getToken()
  const baseUrl =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const formData = new FormData()
  files.forEach((file) => {
    formData.append("files", file)
  })

  const res = await fetch(`${baseUrl}/admin/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      errorData.message || `Upload failed: ${res.status} ${res.statusText}`
    )
  }

  return res.json()
}

// Delete a file by ID
async function deleteFile(fileId: string): Promise<void> {
  await adminFetch<Record<string, unknown>>(`/admin/uploads/${fileId}`, {
    method: "DELETE",
  })
}

// Medusa v2 does NOT provide a GET /admin/uploads listing endpoint.
// We maintain a client-side (session-level) cache inside React Query.
// Uploaded files are added to the cache on success; deleted files are
// removed from it.  The cache starts empty on every page load.

// Hooks
export function useMediaFiles() {
  return useQuery<{ files: MediaFile[] }>({
    queryKey: ["media-files"],
    queryFn: () => ({ files: [] }),
    staleTime: Infinity,       // never refetch — we manage the cache manually
    gcTime: Infinity,          // keep it alive for the whole session
    retry: false,
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (files: File[]) => uploadFiles(files),
    onSuccess: (data) => {
      // Append newly uploaded files into the query cache
      queryClient.setQueryData<{ files: MediaFile[] }>(
        ["media-files"],
        (old) => ({
          files: [...(old?.files ?? []), ...data.files],
        })
      )
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fileId: string) => deleteFile(fileId),
    onSuccess: (_data, fileId) => {
      // Remove deleted file from the query cache
      queryClient.setQueryData<{ files: MediaFile[] }>(
        ["media-files"],
        (old) => ({
          files: (old?.files ?? []).filter((f) => f.id !== fileId),
        })
      )
    },
  })
}

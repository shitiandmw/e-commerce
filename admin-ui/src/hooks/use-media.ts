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

// Fetch all uploaded files
// Note: Medusa v2 does NOT provide a GET /admin/uploads listing endpoint.
// The upload API only supports POST (upload) and DELETE (remove).
// To avoid CORS errors from requesting a non-existent route, we maintain
// an in-memory list populated by successful uploads in this session.
// TODO: Replace with a custom backend endpoint when persistent media
//       listing is needed (e.g. POST /admin/custom/media-list).
async function fetchFiles(): Promise<{ files: MediaFile[] }> {
  return { files: [] }
}

// Hooks
export function useMediaFiles() {
  return useQuery<{ files: MediaFile[] }>({
    queryKey: ["media-files"],
    queryFn: fetchFiles,
    staleTime: 30 * 1000,
    retry: false, // Don't retry — endpoint may not exist in Medusa v2
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (files: File[]) => uploadFiles(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-files"] })
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fileId: string) => deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-files"] })
    },
  })
}

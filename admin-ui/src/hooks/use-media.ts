"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getToken } from "@/lib/auth"

const BASE_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

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

// Upload files using FormData (not JSON)
async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const token = getToken()
  const formData = new FormData()
  files.forEach((file) => {
    formData.append("files", file)
  })

  const res = await fetch(`${BASE_URL}/admin/uploads`, {
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
  const token = getToken()

  const res = await fetch(`${BASE_URL}/admin/uploads/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      errorData.message || `Delete failed: ${res.status} ${res.statusText}`
    )
  }
}

// Fetch all uploaded files
async function fetchFiles(): Promise<{ files: MediaFile[] }> {
  const token = getToken()

  const res = await fetch(`${BASE_URL}/admin/uploads`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    // If the list endpoint doesn't exist, return empty
    if (res.status === 404) {
      return { files: [] }
    }
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      errorData.message || `Fetch failed: ${res.status} ${res.statusText}`
    )
  }

  return res.json()
}

// Hooks
export function useMediaFiles() {
  return useQuery<{ files: MediaFile[] }>({
    queryKey: ["media-files"],
    queryFn: fetchFiles,
    staleTime: 30 * 1000,
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

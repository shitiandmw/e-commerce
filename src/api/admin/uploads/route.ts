import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import fs from "fs"
import path from "path"

/**
 * GET /admin/uploads
 *
 * Lists all uploaded files from the local storage directory.
 *
 * Medusa v2's File Module doesn't persist file metadata in the database,
 * so we scan the `static/` directory to build the list.
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const staticDir = path.resolve(process.cwd(), "static")

  if (!fs.existsSync(staticDir)) {
    return res.status(200).json({ files: [] })
  }

  const entries = fs.readdirSync(staticDir, { withFileTypes: true })

  const baseUrl = `${req.protocol}://${req.get("host")}`

  const files = entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry) => {
      const stat = fs.statSync(path.join(staticDir, entry.name))
      const ext = path.extname(entry.name).toLowerCase()

      return {
        id: entry.name,
        url: `${baseUrl}/static/${encodeURIComponent(entry.name)}`,
        name: entry.name,
        size: stat.size,
        mime_type: getMimeType(ext),
        created_at: stat.birthtime.toISOString(),
      }
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  // Simple pagination
  const offset = Number(req.query.offset ?? 0)
  const limit = Number(req.query.limit ?? 50)
  const paged = files.slice(offset, offset + limit)

  res.status(200).json({
    files: paged,
    count: files.length,
    offset,
    limit,
  })
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".csv": "text/csv",
    ".txt": "text/plain",
  }
  return map[ext] || "application/octet-stream"
}

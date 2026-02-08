/**
 * CSV utility functions for import/export.
 * Handles CSV parsing, generation, and file download/upload.
 */

/**
 * Escape a CSV field value. Wraps in quotes if it contains commas,
 * newlines, or double quotes (which are themselves doubled).
 */
function escapeField(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Generate a CSV string from rows of data given column definitions.
 */
export function generateCSV<T>(
  rows: T[],
  columns: { header: string; accessor: (row: T) => unknown }[]
): string {
  const headerLine = columns.map((col) => escapeField(col.header)).join(",")
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeField(col.accessor(row))).join(",")
  )
  return [headerLine, ...dataLines].join("\n")
}

/**
 * Parse a CSV string into an array of objects keyed by header names.
 * Handles quoted fields with commas and escaped double quotes.
 */
export function parseCSV(csv: string): Record<string, string>[] {
  const lines = splitCSVLines(csv.trim())
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const results: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseCSVLine(line)
    const obj: Record<string, string> = {}
    headers.forEach((header, idx) => {
      obj[header.trim()] = (values[idx] || "").trim()
    })
    results.push(obj)
  }

  return results
}

/**
 * Split CSV text into lines, respecting quoted fields that span multiple lines.
 */
function splitCSVLines(text: string): string[] {
  const lines: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      inQuotes = !inQuotes
      current += char
    } else if (char === "\n" && !inQuotes) {
      lines.push(current)
      current = ""
    } else if (char === "\r" && !inQuotes) {
      // skip \r, handle \r\n
      if (text[i + 1] === "\n") i++
      lines.push(current)
      current = ""
    } else {
      current += char
    }
  }
  if (current) lines.push(current)
  return lines
}

/**
 * Parse a single CSV line into field values.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++ // skip next quote
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ",") {
        fields.push(current)
        current = ""
      } else {
        current += char
      }
    }
  }
  fields.push(current)
  return fields
}

/**
 * Trigger a download of a CSV file in the browser.
 */
export function downloadCSV(csvContent: string, filename: string) {
  const BOM = "\uFEFF" // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Read a File object as text.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

/**
 * Generate a CSV template string from column headers.
 */
export function generateTemplate(headers: string[]): string {
  return headers.map((h) => escapeField(h)).join(",")
}

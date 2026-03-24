import fs from "node:fs/promises"
import path from "node:path"
import * as OpenCC from "opencc-js"

const converter = OpenCC.Converter({ from: "hk", to: "cn" })

const TARGETS = [
  { file: "data/brands.csv", fields: ["brand_cn"] },
  { file: "data/categories.csv", fields: ["Name"] },
  { file: "data/menu_items.csv", fields: ["label", "parent_label"] },
  { file: "data/products.csv", fields: ["brand_cn", "title"] },
  { file: "data/products_with_urls.csv", fields: ["brand_cn", "title"] },
]

function parseCsvLine(line) {
  const values = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      values.push(current)
      current = ""
      continue
    }

    current += char
  }

  values.push(current)
  return values
}

function parseCsv(content) {
  const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n")
  const lines = normalized.split("\n")

  if (lines.at(-1) === "") {
    lines.pop()
  }

  return lines.map(parseCsvLine)
}

function escapeCsv(value) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

function stringifyCsv(rows) {
  return `\uFEFF${rows
    .map((row) => row.map((cell) => escapeCsv(cell ?? "")).join(","))
    .join("\n")}\n`
}

function convertValue(value) {
  if (!value || !/[\u3400-\u9fff]/.test(value)) {
    return value
  }

  return converter(value)
}

async function processTarget(target) {
  const absPath = path.resolve(target.file)
  const original = await fs.readFile(absPath, "utf8")
  const rows = parseCsv(original)

  if (rows.length === 0) {
    return { file: target.file, changedRows: 0, changedCells: 0 }
  }

  const [header, ...dataRows] = rows
  const fieldIndexes = target.fields
    .map((field) => [field, header.indexOf(field)])
    .filter(([, index]) => index >= 0)

  let changedRows = 0
  let changedCells = 0

  for (const row of dataRows) {
    let rowChanged = false

    for (const [, index] of fieldIndexes) {
      const currentValue = row[index] ?? ""
      const nextValue = convertValue(currentValue)

      if (nextValue !== currentValue) {
        row[index] = nextValue
        changedCells += 1
        rowChanged = true
      }
    }

    if (rowChanged) {
      changedRows += 1
    }
  }

  const nextContent = stringifyCsv([header, ...dataRows])

  if (nextContent !== original) {
    await fs.writeFile(absPath, nextContent, "utf8")
  }

  return { file: target.file, changedRows, changedCells }
}

async function main() {
  const results = []

  for (const target of TARGETS) {
    results.push(await processTarget(target))
  }

  for (const result of results) {
    console.log(
      `${result.file}: ${result.changedRows} row(s), ${result.changedCells} cell(s) updated`
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

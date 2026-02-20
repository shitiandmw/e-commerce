/**
 * Patch Medusa develop command to ignore admin-ui, storefront and storefront-v2
 * directories in file watcher.
 *
 * Problem: Medusa's chokidar watcher monitors the entire project root but only
 * ignores root-level node_modules. Our admin-ui/ and storefront/ directories
 * (separate Next.js apps) contain their own node_modules with tens of thousands
 * of files, causing ENFILE (file table overflow) errors and unwanted server
 * restarts when these apps generate or modify files (e.g. next-env.d.ts).
 *
 * This script runs automatically via the "postinstall" npm hook.
 */
const fs = require("fs")
const path = require("path")

const developJsPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "@medusajs",
  "medusa",
  "dist",
  "commands",
  "develop.js"
)

try {
  if (!fs.existsSync(developJsPath)) {
    console.log("[patch-watcher] develop.js not found, skipping patch.")
    process.exit(0)
  }

  let content = fs.readFileSync(developJsPath, "utf8")
  let patched = false

  // Add "admin-ui" to the ignored array
  if (!content.includes('"admin-ui"')) {
    content = content.replace(
      '"src/admin",',
      '"src/admin",\n                    "admin-ui",'
    )
    patched = true
  }

  // Add "storefront" to the ignored array
  if (!content.includes('"storefront"')) {
    content = content.replace(
      '"admin-ui",',
      '"admin-ui",\n                    "storefront",'
    )
    patched = true
  }

  // Add "storefront-v2" to the ignored array
  if (!content.includes('"storefront-v2"')) {
    content = content.replace(
      '"storefront",',
      '"storefront",\n                    "storefront-v2",'
    )
    patched = true
  }

  if (!patched) {
    console.log("[patch-watcher] Already patched, skipping.")
    process.exit(0)
  }

  fs.writeFileSync(developJsPath, content)
  console.log("[patch-watcher] Patched: admin-ui + storefront + storefront-v2 added to watcher ignore list.")
} catch (err) {
  console.error("[patch-watcher] Failed to patch:", err.message)
  // Non-fatal — don't block npm install
  process.exit(0)
}

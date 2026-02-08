/**
 * Patch Medusa develop command to ignore admin-ui directory in file watcher.
 *
 * Problem: Medusa's chokidar watcher monitors the entire project root but only
 * ignores root-level node_modules. Our admin-ui/ directory (a separate Next.js
 * app) contains its own node_modules with tens of thousands of files, causing
 * ENFILE (file table overflow) errors and unwanted server restarts.
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

  if (content.includes('"admin-ui"')) {
    console.log("[patch-watcher] Already patched, skipping.")
    process.exit(0)
  }

  // Add "admin-ui" to the ignored array in the chokidar.watch() call
  content = content.replace(
    '"src/admin",',
    '"src/admin",\n                    "admin-ui",'
  )

  fs.writeFileSync(developJsPath, content)
  console.log("[patch-watcher] Patched: admin-ui added to watcher ignore list.")
} catch (err) {
  console.error("[patch-watcher] Failed to patch:", err.message)
  // Non-fatal — don't block npm install
  process.exit(0)
}

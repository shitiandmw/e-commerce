import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

let cachedWidget: string | null = null

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  if (!cachedWidget) {
    const widgetPath = join(process.cwd(), "src/chat-widget/dist/widget.js")
    if (!existsSync(widgetPath)) {
      res.status(404).json({ message: "Widget not built. Run: npm run build:widget" })
      return
    }

    // Inject publishable API key into widget
    let publishableKey = ""
    try {
      const query = req.scope.resolve("query")
      const { data: apiKeys } = await query.graph({
        entity: "api_key",
        fields: ["token", "type", "revoked_at"],
        filters: { type: "publishable" },
      })
      const activeKey = apiKeys?.find((k: any) => !k.revoked_at)
      if (activeKey) publishableKey = activeKey.token
    } catch {
      // Ignore — widget will work without key if store routes don't require it
    }

    const rawJs = readFileSync(widgetPath, "utf-8")
    const socketPort = process.env.SOCKET_PORT || "9001"
    cachedWidget = `window.__TIMECIGAR_CHAT_CONFIG__=${JSON.stringify({ publishableKey, socketPort })};\n${rawJs}`
  }

  res.setHeader("Content-Type", "application/javascript")
  res.setHeader("Cache-Control", "public, max-age=3600")
  res.send(cachedWidget)
}

import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CHAT_MODULE } from "../../../../modules/chat"
import ChatModuleService from "../../../../modules/chat/service"
import { updateChatSettingsWorkflow } from "../../../../workflows/chat/update-chat-settings"
import { PostAdminUpdateChatSettingsType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const chatService: ChatModuleService = req.scope.resolve(CHAT_MODULE)
  const settings = await chatService.listChatSettings({}, { take: 1 })

  res.json({ settings: settings[0] || null })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateChatSettingsType>,
  res: MedusaResponse
) => {
  const { result } = await updateChatSettingsWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ settings: result })
}

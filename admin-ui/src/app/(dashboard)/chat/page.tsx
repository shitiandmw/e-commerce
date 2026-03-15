"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Settings } from "lucide-react"
import { ConversationList } from "@/components/chat/conversation-list"
import { ChatPanel } from "@/components/chat/chat-panel"
import { AISettings } from "@/components/chat/ai-settings"
import { useChatSocketContext } from "@/providers/chat-socket-provider"
import { useChatSettings, useUpdateChatSettings } from "@/hooks/use-chat"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Toast, useToast } from "@/components/ui/toast"

export default function ChatPage() {
  const t = useTranslations("chat")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { connected, resetUnread, joinConversation, sendMessage, sendTyping } = useChatSocketContext()
  const { data } = useChatSettings()
  const updateMutation = useUpdateChatSettings()
  const { toast, showToast, hideToast } = useToast()

  const aiEnabled = data?.chat_settings?.[0]?.ai_enabled || false

  useEffect(() => { resetUnread() }, [])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    joinConversation(id)
  }

  const toggleAI = (enabled: boolean) => {
    updateMutation.mutate({ ai_enabled: enabled })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={aiEnabled} onCheckedChange={toggleAI} />
            <Label className="text-sm">AI托管</Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            AI设置
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
            <span className="text-muted-foreground">{connected ? t("connected") : t("disconnected")}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ConversationList selectedId={selectedId} onSelect={handleSelect} />
        <ChatPanel
          conversationId={selectedId}
          connected={connected}
          onSendMessage={sendMessage}
          onTyping={sendTyping}
        />
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onClose={() => setSettingsOpen(false)}>
          <DialogHeader>
            <DialogTitle>AI托管设置</DialogTitle>
          </DialogHeader>
          <AISettings onSuccess={() => showToast("AI设置保存成功", "success")} onError={() => showToast("AI设置保存失败", "error")} />
        </DialogContent>
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useChatSettings, useUpdateChatSettings } from "@/hooks/use-chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select } from "@/components/ui/select"

const schema = z.object({
  ai_enabled: z.boolean(),
  ai_provider: z.enum(["openai", "anthropic"]).optional(),
  ai_api_url: z.string().optional(),
  ai_api_key: z.string().optional(),
  ai_model: z.string().optional(),
  ai_system_prompt: z.string().optional(),
  ai_debounce_seconds: z.number().min(1).max(60).optional(),
})

type FormData = z.infer<typeof schema>

type AISettingsProps = {
  onSuccess?: () => void
  onError?: () => void
}

export function AISettings({ onSuccess, onError }: AISettingsProps) {
  const { data, isLoading } = useChatSettings()
  const updateMutation = useUpdateChatSettings()
  const [showKey, setShowKey] = useState(false)

  const settings = data?.chat_settings?.[0]

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: settings ? {
      ai_enabled: settings.ai_enabled || false,
      ai_provider: settings.ai_provider || undefined,
      ai_api_url: settings.ai_api_url || undefined,
      ai_api_key: settings.ai_api_key || undefined,
      ai_model: settings.ai_model || undefined,
      ai_system_prompt: settings.ai_system_prompt || undefined,
      ai_debounce_seconds: settings.ai_debounce_seconds || 3,
    } : undefined,
  })

  const aiEnabled = watch("ai_enabled")

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data, {
      onSuccess: () => onSuccess?.(),
      onError: () => onError?.(),
    })
  }

  if (isLoading) return <div>加载中...</div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>启用AI托管</Label>
          <p className="text-sm text-muted-foreground">用户发消息后自动AI回复</p>
        </div>
        <Switch checked={aiEnabled} onCheckedChange={(v) => setValue("ai_enabled", v)} />
      </div>

      {aiEnabled && (
        <>
          <div>
            <Label>AI提供商</Label>
            <Select value={watch("ai_provider") || ""} onChange={(e) => setValue("ai_provider", e.target.value as any)}>
              <option value="">选择提供商</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </Select>
          </div>

          <div>
            <Label>API密钥</Label>
            <div className="flex gap-2">
              <Input type={showKey ? "text" : "password"} {...register("ai_api_key")} />
              <Button type="button" variant="outline" onClick={() => setShowKey(!showKey)}>
                {showKey ? "隐藏" : "显示"}
              </Button>
            </div>
          </div>

          <div>
            <Label>模型名称</Label>
            <Input placeholder="gpt-4o / claude-3-5-sonnet-20241022" {...register("ai_model")} />
          </div>

          <div>
            <Label>API地址(可选)</Label>
            <Input placeholder="留空使用默认地址" {...register("ai_api_url")} />
          </div>

          <div>
            <Label>系统提示词</Label>
            <Textarea rows={4} placeholder="你是一个专业的客服助手..." {...register("ai_system_prompt")} />
          </div>

          <div>
            <Label>防抖秒数</Label>
            <Input type="number" min={1} max={60} {...register("ai_debounce_seconds", { valueAsNumber: true })} />
            <p className="text-sm text-muted-foreground">用户停止发消息后等待多久触发AI回复</p>
          </div>
        </>
      )}

      <Button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? "保存中..." : "保存设置"}
      </Button>
    </form>
  )
}

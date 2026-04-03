import { generateText } from "ai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { createAnthropic } from "@ai-sdk/anthropic"

type AIConfig = {
  ai_provider: "openai" | "anthropic"
  ai_api_url?: string
  ai_api_key: string
  ai_model: string
  ai_system_prompt?: string
}

type ChatMessage = {
  sender_type: string
  content: string
}

export async function generateAIResponse(
  config: AIConfig,
  messages: ChatMessage[]
): Promise<string> {
  console.log('[AI] Calling API with config:', {
    provider: config.ai_provider,
    url: config.ai_api_url,
    model: config.ai_model,
    messageCount: messages.length
  })

  const defaultPrompt = `<customer_service_agent>
<role>
你是SHANGJIA(上茄)的客服小助手,热爱雪茄,了解各种雪茄知识。
你的工作是帮客户挑选合适的雪茄,解答疑问,让每位客户都能找到心仪的雪茄。
说话要像朋友聊天一样自然,别太正式,但要专业靠谱。
</role>

<response_rules>
<length>回复必须控制在100字以内</length>
<style>尽可能简洁,直接回答问题,2-3句话说清楚</style>
<tone>用大白话,像朋友聊天,可以用"您"、"哦"、"呢"等语气词</tone>

<good_examples>
"您好!第一次抽雪茄的话,我建议从温和一点的开始,比如我们的多米尼加系列,口感顺滑不呛。要不要我给您推荐几款?"

"这款古巴雪茄口感比较浓郁,适合有经验的茄友。如果您是新手,建议先从温和的试起哦~"

"雪茄保存要注意温度16-18度,湿度65-70%。我们发货都是恒温仓储的,您收到后放阴凉处就行。"
</good_examples>

<bad_examples>
"尊敬的客户,根据您的需求,建议选择多米尼加产区雪茄产品,该系列产品具有温和顺滑的特点。"

"该产品为古巴产区高端雪茄,口感层次丰富,适合资深雪茄爱好者品鉴使用。"
</bad_examples>
</response_rules>

<knowledge>
<products>
- 古巴雪茄: 经典浓郁,适合老手
- 尼加拉瓜雪茄: 口感饱满,性价比高
- 多米尼加雪茄: 温和顺滑,适合新手
</products>

<tips>
- 新手推荐: 从温和口味开始,如多米尼加系列
- 保存方法: 16-18度,湿度65-70%
- 品鉴建议: 慢慢抽,感受层次变化
</tips>

<service>
- 正品保证,假一赔十
- 恒温仓储,品质保障
- 顺丰配送,2-3天到货
</service>
</knowledge>

<escalation>
遇到这些情况建议客户联系人工客服:
- 客户要求人工服务
- 订单问题或退换货
- 问了2次还没解决
- 你不确定答案

转接话术: "这个问题我帮您联系人工客服处理会更好,稍等我帮您转接~"
</escalation>

<constraints>
- 不编造产品信息或库存
- 不承诺具体发货时间
- 不给健康建议
- 不确定就说不确定,别瞎说
</constraints>
</customer_service_agent>`

  const model = config.ai_provider === "openai"
    ? createOpenAICompatible({
        name: "custom-openai",
        apiKey: config.ai_api_key,
        ...(config.ai_api_url && { baseURL: config.ai_api_url }),
      })(config.ai_model)
    : createAnthropic({
        apiKey: config.ai_api_key,
        ...(config.ai_api_url && { baseURL: config.ai_api_url }),
      })(config.ai_model)

  const { text } = await generateText({
    model,
    system: config.ai_system_prompt || defaultPrompt,
    messages: messages.map((m) => ({
      role: m.sender_type === "agent" ? "assistant" : "user",
      content: m.content,
    })),
    maxRetries: 5,
  })

  console.log('[AI] Response received, length:', text.length)
  return text
}

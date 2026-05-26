import express from 'express'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

router.post('/chat', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { message, knowledge_ids } = req.body

    if (!message) {
      return res.status(400).json({ detail: 'Message is required' })
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const zhipuResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        stream: true,
      }),
    })

    if (!zhipuResponse.ok) {
      const errorData = await zhipuResponse.json().catch(() => ({ error: 'AI API error' })) as { error?: string }
      res.write(`data: ${JSON.stringify({ error: errorData.error || 'AI chat failed' })}\n\n`)
      res.end()
      return
    }

    const reader = zhipuResponse.body?.getReader()
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'No response from AI' })}\n\n`)
      res.end()
      return
    }

    const decoder = new TextDecoder('utf-8')
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const content = json.choices?.[0]?.delta?.content
            if (content) {
              res.write(`data: ${content}\n\n`)
            }
          } catch {
            continue
          }
        }
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error: any) {
    console.error('AI chat error:', error)
    res.status(500).json({ detail: 'AI chat failed' })
  }
})

export default router

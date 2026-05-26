import { useState, useEffect, useRef } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/Sidebar'
import { MessageInput } from '@/components/MessageInput'
import { Bot, Sparkles, BookOpen } from 'lucide-react'
import { useAIStore } from '@/store/aiStore'
import { cn } from '@/lib/utils'
import type { AIMessage } from '@/types'

export default function AIAssistantPage() {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)
  const {
    messages,
    isStreaming,
    addMessage,
    updateLastAssistant,
    setStreaming,
    knowledgeDocs,
    selectedKnowledgeIds,
    setKnowledgeDocs,
    toggleKnowledgeId,
  } = useAIStore()

  useEffect(() => {
    loadKnowledgeDocs()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadKnowledgeDocs = async () => {
    try {
      const res = await api.getKnowledgeDocs()
      setKnowledgeDocs(res.documents)
    } catch (e) {
      console.error('Failed to load knowledge docs:', e)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return
    const content = inputValue.trim()
    setInputValue('')

    addMessage({
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      knowledge_ids: selectedKnowledgeIds,
    })

    setStreaming(true)
    try {
      const reader = await api.aiChat(content, selectedKnowledgeIds)
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: streamDone } = await reader.read()
        done = streamDone
        if (value) {
          const text = decoder.decode(value, { stream: true })
          const lines = text.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const chunk = line.slice(6)
              if (chunk === '[DONE]') continue
              updateLastAssistant(chunk)
            }
          }
        }
      }
    } catch (e: any) {
      updateLastAssistant(`错误: ${e.message}`)
    } finally {
      setStreaming(false)
    }
  }

  const suggestions = ['解释量子计算', '写一段 Python 代码', '总结机器学习的核心概念', '帮我翻译一段英文']

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-50 via-accent-50/20 to-purple-50/20">
      <Sidebar />
      <main className="ml-16 flex flex-1 flex-col">
        <div className="flex items-center gap-4 border-b border-surface-200/50 bg-white/60 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              AI 助手
            </h2>
          </div>

          {knowledgeDocs.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-600" />
              <div className="flex gap-2">
                {knowledgeDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => toggleKnowledgeId(doc.id)}
                    className={cn(
                      'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border',
                      selectedKnowledgeIds.includes(doc.id)
                        ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-600 text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
                    )}
                    title={doc.filename}
                  >
                    {doc.filename.length > 12
                      ? doc.filename.slice(0, 12) + '...'
                      : doc.filename}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6">
                <div className="relative mb-8">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 animate-pulse-glow">
                    <Sparkles className="h-12 w-12 text-primary-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-white text-xs font-bold">
                    AI
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  AI 智能助手
                </h3>
                <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
                  你可以向我提问任何问题，也可以选择知识库文档让 AI 基于你的资料进行回答
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {suggestions.map((q, index) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInputValue(q)
                      }}
                      className="group rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-all duration-300 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => (
                  <AIMessageBubble
                    key={idx}
                    message={msg}
                    isLast={idx === messages.length - 1}
                    isStreaming={isStreaming}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
            <MessageInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              disabled={isStreaming}
              placeholder={isStreaming ? 'AI 正在回复...' : '向 AI 提问...'}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function AIMessageBubble({
  message,
  isLast,
  isStreaming,
}: {
  message: AIMessage
  isLast: boolean
  isStreaming: boolean
}) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-4 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold',
          isUser
            ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-[0_3px_10px_rgba(0,0,0,0.3)]'
            : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 shadow-[0_3px_10px_rgba(0,0,0,0.15)]'
        )}
      >
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={cn('flex flex-col max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-md bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)]'
              : 'rounded-tl-md bg-white border border-gray-200 text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
          )}
        >
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          {isLast && isStreaming && !isUser && (
            <span className="inline-block ml-1 w-1.5 h-4 bg-gray-600 animate-pulse align-middle" />
          )}
        </div>
        {message.knowledge_ids && message.knowledge_ids.length > 0 && (
          <span className="mt-1.5 text-xs text-gray-600 flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            已启用知识库检索
          </span>
        )}
      </div>
    </div>
  )
}

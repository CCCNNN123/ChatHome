import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { chatWS } from '@/services/websocket'
import { useAuthStore } from '@/store/authStore'
import { useRoomStore } from '@/store/roomStore'
import { useChatWebSocket } from '@/hooks/useChatWebSocket'
import { Sidebar } from '@/components/Sidebar'
import { ChatMessage } from '@/components/ChatMessage'
import { MessageInput } from '@/components/MessageInput'
import { ArrowLeft, Users } from 'lucide-react'
import type { Message, WSMessageServer } from '@/types'

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const roomIdNum = roomId ? parseInt(roomId) : null
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const onlineUsers = useRoomStore((s) => s.onlineUsers)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useChatWebSocket(roomIdNum)

  useEffect(() => {
    if (!roomIdNum) return
    loadMessages()
  }, [roomIdNum])

  useEffect(() => {
    if (!roomIdNum || !user) return

    const handleNewMessage = (msg: WSMessageServer) => {
      if (msg.room_id !== roomIdNum) return
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id || Date.now(),
          room_id: msg.room_id || roomIdNum,
          user_id: msg.user_id || 0,
          username: msg.username || '未知',
          content: msg.content || '',
          created_at: msg.created_at || new Date().toISOString(),
        },
      ])
    }

    chatWS.on('new_message', handleNewMessage)
    return () => chatWS.off('new_message', handleNewMessage)
  }, [roomIdNum, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    try {
      const res = await api.getMessages(roomIdNum!)
      setMessages(res.messages)
    } catch (e) {
      console.error('Failed to load messages:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || !roomIdNum) return
    chatWS.send({
      type: 'chat_message',
      room_id: roomIdNum,
      content: inputValue.trim(),
    })
    setInputValue('')
  }, [inputValue, roomIdNum])

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-50 via-accent-50/20 to-purple-50/20">
      <Sidebar />
      <main className="ml-16 flex flex-1 flex-col">
        <div className="flex items-center gap-4 border-b border-surface-200/50 bg-white/60 backdrop-blur-xl px-6 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all duration-300 hover:bg-surface-100 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              聊天室 #{roomId}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-1.5">
            <Users className="h-4 w-4 text-primary-500" />
            <span className="text-xs font-medium text-gray-600">{onlineUsers.length} 在线</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col">
            {loading ? (
              <div className="flex-1 space-y-4 p-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-9 w-9 rounded-xl bg-surface-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 rounded-lg bg-surface-100" />
                      <div className="h-9 w-3/4 rounded-2xl bg-surface-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isOwn={msg.user_id === user?.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
            <MessageInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              placeholder="输入消息，Enter 发送..."
            />
          </div>

          <aside className="hidden w-60 border-l border-surface-200 bg-white/80 backdrop-blur-xl p-4 lg:block">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-primary-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                在线用户
              </h3>
            </div>
            <div className="space-y-2">
              {onlineUsers.map((u) => (
                <div
                  key={u}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 ${
                    u === user?.username
                      ? 'bg-primary-50'
                      : 'hover:bg-surface-100'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${
                      u === user?.username
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                        : 'bg-surface-200 text-gray-600'
                    }`}
                  >
                    {u.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {u}
                    </p>
                    {u === user?.username && (
                      <p className="text-xs text-primary-500">你</p>
                    )}
                  </div>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">暂无在线用户</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

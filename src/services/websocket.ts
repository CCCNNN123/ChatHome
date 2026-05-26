import type { WSMessageClient, WSMessageServer } from '@/types'

const WS_URL = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws`

type MessageHandler = (msg: WSMessageServer) => void

class ChatWebSocket {
  private ws: WebSocket | null = null
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private url: string

  constructor(url: string = WS_URL) {
    this.url = url
  }

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return
    this.ws = new WebSocket(`${this.url}?token=${token}`)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessageServer = JSON.parse(event.data)
        const typeHandlers = this.handlers.get(msg.type)
        if (typeHandlers) {
          typeHandlers.forEach((h) => h(msg))
        }
      } catch (e) {
        console.error('WS parse error:', e)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.reconnectTimer = setTimeout(() => this.connect(token), 3000)
    }

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }
  }

  send(msg: WSMessageClient) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
  }

  off(type: string, handler: MessageHandler) {
    this.handlers.get(type)?.delete(handler)
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.ws?.close()
    this.ws = null
  }
}

export const chatWS = new ChatWebSocket()
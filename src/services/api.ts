const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

function getToken(): string | null {
  const stored = localStorage.getItem('chathome_user')
  if (stored) {
    try {
      return JSON.parse(stored).token
    } catch {
      return null
    }
  }
  return null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }

  return res.json()
}

import type { User, Room, Message, Document } from '@/types'

interface AuthResponse {
  user: User
  token: string
}

export const api = {
  register: (username: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  getRooms: () => request<{ rooms: Room[] }>('/rooms'),

  createRoom: (name: string) =>
    request<{ room: Room }>('/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  joinRoom: (room_id: number) =>
    request<{ room: Room }>('/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id }),
    }),

  getMessages: (roomId: number) =>
    request<{ messages: Message[] }>(`/rooms/${roomId}/messages`),

  getKnowledgeDocs: () =>
    request<{ documents: Document[] }>('/knowledge/documents'),

  deleteKnowledgeDoc: (id: number) =>
    request<{ success: boolean }>(`/knowledge/${id}`, { method: 'DELETE' }),

  async uploadKnowledgeDoc(file: File): Promise<Document> {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/knowledge/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(err.detail || 'Upload failed')
    }
    const data = await res.json()
    return data.document
  },

  async aiChat(message: string, knowledgeIds: number[]): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const token = getToken()
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, knowledge_ids: knowledgeIds }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'AI chat failed' }))
      throw new Error(err.detail || 'AI chat failed')
    }
    return res.body!.getReader()
  },
}

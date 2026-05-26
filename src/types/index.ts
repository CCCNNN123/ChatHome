export interface User {
  id: number
  username: string
  token: string
  created_at: string
}

export interface Room {
  id: number
  name: string
  created_by: number
  created_at: string
  last_message?: string
  member_count?: number
}

export interface Message {
  id: number
  room_id: number
  user_id: number
  username: string
  content: string
  created_at: string
}

export interface Document {
  id: number
  user_id: number
  filename: string
  filepath: string
  chunk_count: number
  created_at: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  knowledge_ids?: number[]
}

export interface WSMessageClient {
  type: 'join_room' | 'leave_room' | 'chat_message'
  room_id?: number
  content?: string
  username?: string
}

export interface WSMessageServer {
  type: 'user_joined' | 'user_left' | 'new_message' | 'error'
  username?: string
  users?: string[]
  id?: number
  content?: string
  created_at?: string
  message?: string
  user_id?: number
  room_id?: number
}
export interface User {
  id: number
  username: string
  password: string
  nickname?: string
  avatar?: string
  created_at: string
  updated_at: string
}

export interface Room {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  room_id: number
  user_id: number
  username: string
  content: string
  message_type?: string
  emoji?: string
  created_at: string
}

export interface Document {
  id: number
  filename: string
  file_path: string
  chunk_count: number
  created_at: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface WSMessageServer {
  type: string
  id?: number
  room_id?: number
  user_id?: number
  username?: string
  content?: string
  emoji?: string
  created_at?: string
  online_users?: string[]
}

export interface WSMessageClient {
  type: string
  room_id?: number
  content?: string
  emoji?: string
}

import { create } from 'zustand'
import type { Room } from '@/types'

interface RoomState {
  rooms: Room[]
  currentRoomId: number | null
  onlineUsers: string[]
  setRooms: (rooms: Room[]) => void
  addRoom: (room: Room) => void
  removeRoom: (id: number) => void
  setCurrentRoom: (id: number | null) => void
  setOnlineUsers: (users: string[]) => void
  addOnlineUser: (username: string) => void
  removeOnlineUser: (username: string) => void
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  currentRoomId: null,
  onlineUsers: [],
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) => set((s) => ({ rooms: [...s.rooms, room] })),
  removeRoom: (id) => set((s) => ({ rooms: s.rooms.filter((r) => r.id !== id) })),
  setCurrentRoom: (id) => set({ currentRoomId: id }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (username) => set((s) => ({ onlineUsers: [...s.onlineUsers, username] })),
  removeOnlineUser: (username) => set((s) => ({ onlineUsers: s.onlineUsers.filter((u) => u !== username) })),
}))
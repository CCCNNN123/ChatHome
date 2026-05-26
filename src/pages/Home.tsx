import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { useRoomStore } from '@/store/roomStore'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/Sidebar'
import { Plus, Hash, Users } from 'lucide-react'
import type { Room } from '@/types'

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinId, setJoinId] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setCurrentRoom = useRoomStore((s) => s.setCurrentRoom)

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      const res = await api.getRooms()
      setRooms(res.rooms)
    } catch (e) {
      console.error('Failed to load rooms:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!roomName.trim()) return
    try {
      const res = await api.createRoom(roomName.trim())
      await api.joinRoom(res.room.id)
      setRooms((prev) => [...prev, res.room])
      setRoomName('')
      setShowCreate(false)
      setCurrentRoom(res.room.id)
      navigate(`/chat/${res.room.id}`)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleJoin = async () => {
    const id = parseInt(joinId)
    if (!id) return
    try {
      const res = await api.joinRoom(id)
      setRooms((prev) => {
        if (prev.find((r) => r.id === id)) return prev
        return [...prev, res.room]
      })
      setJoinId('')
      setShowJoin(false)
      setCurrentRoom(id)
      navigate(`/chat/${id}`)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const enterRoom = (room: Room) => {
    setCurrentRoom(room.id)
    navigate(`/chat/${room.id}`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-50 via-accent-50/30 to-purple-50/30">
      <Sidebar />
      <main className="ml-16 flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            ChatHome
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            欢迎回来，{user?.username}
          </p>
        </div>

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            创建聊天室
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition-all duration-300 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm"
          >
            <Hash className="h-4 w-4" />
            加入聊天室
          </button>
        </div>

        {showCreate && (
          <div className="mb-4 animate-scale-in rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
            <div className="flex gap-3">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="聊天室名称"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-300 focus:border-gray-400 focus:bg-white"
                autoFocus
              />
              <button
                onClick={handleCreate}
                className="rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
              >
                创建
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-100"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {showJoin && (
          <div className="mb-4 animate-scale-in rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
            <div className="flex gap-3">
              <input
                type="number"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="聊天室 ID"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-300 focus:border-gray-400 focus:bg-white"
                autoFocus
              />
              <button
                onClick={handleJoin}
                className="rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
              >
                加入
              </button>
              <button
                onClick={() => setShowJoin(false)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-100"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">暂无聊天室</h3>
            <p className="mt-2 text-sm text-gray-500">创建一个新聊天室或加入已有的聊天室</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
            >
              创建聊天室
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room, index) => (
              <button
                key={room.id}
                onClick={() => enterRoom(room)}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-300 hover:border-gray-300 hover:shadow-medium hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                      <Hash className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {room.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        ID: {room.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

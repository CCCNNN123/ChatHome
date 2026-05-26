import { useEffect } from 'react'
import { chatWS } from '@/services/websocket'
import { useRoomStore } from '@/store/roomStore'
import { useAuthStore } from '@/store/authStore'
import type { WSMessageServer } from '@/types'

export function useChatWebSocket(roomId: number | null) {
  const { addOnlineUser, removeOnlineUser, setOnlineUsers } = useRoomStore()
  const token = useAuthStore((s) => s.token)
  const username = useAuthStore((s) => s.user?.username)

  useEffect(() => {
    if (!token) return
    chatWS.connect(token)
    return () => {
      if (roomId) {
        chatWS.send({
          type: 'leave_room',
          room_id: roomId,
        })
      }
    }
  }, [token])

  useEffect(() => {
    if (!roomId || !username) return

    chatWS.send({
      type: 'join_room',
      room_id: roomId,
      username,
    })

    const handleJoined = (msg: WSMessageServer) => {
      if (msg.users) setOnlineUsers(msg.users)
    }
    const handleLeft = (msg: WSMessageServer) => {
      if (msg.username) removeOnlineUser(msg.username)
      if (msg.users) setOnlineUsers(msg.users)
    }

    chatWS.on('user_joined', handleJoined)
    chatWS.on('user_left', handleLeft)

    return () => {
      chatWS.off('user_joined', handleJoined)
      chatWS.off('user_left', handleLeft)
    }
  }, [roomId, username])
}
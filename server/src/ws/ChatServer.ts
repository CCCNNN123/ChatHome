import { WebSocketServer, WebSocket, type RawData } from 'ws'
import jwt from 'jsonwebtoken'
import { pool } from '../db/connection'
import type { WSMessageServer, WSMessageClient } from '../types'

interface ClientConnection {
  ws: WebSocket
  userId: number
  username: string
  roomIds: number[]
}

export class ChatServer {
  private wss: WebSocketServer
  private clients: Map<string, ClientConnection> = new Map()
  private roomClients: Map<number, Set<string>> = new Map()

  constructor(wss: WebSocketServer) {
    this.wss = wss
    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req)
    })
  }

  private async handleConnection(ws: WebSocket, req: any) {
    const token = req.url?.split('token=')[1]

    if (!token) {
      ws.close(1008, 'No token provided')
      return
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number }
      
      const [rows] = await pool.execute('SELECT id, username FROM users WHERE id = ?', [decoded.id])
      const user = (rows as { id: number; username: string }[])[0]

      if (!user) {
        ws.close(1008, 'Invalid token')
        return
      }

      const clientId = this.generateClientId()
      const connection: ClientConnection = {
        ws,
        userId: user.id,
        username: user.username,
        roomIds: [],
      }

      this.clients.set(clientId, connection)

      this.joinUserToRooms(clientId, connection)

      ws.on('message', (data) => {
        this.handleMessage(clientId, data)
      })

      ws.on('close', () => {
        this.handleDisconnect(clientId)
      })
    } catch (error) {
      ws.close(1008, 'Invalid token')
    }
  }

  private async joinUserToRooms(clientId: string, connection: ClientConnection) {
    const [rows] = await pool.execute(
      'SELECT room_id FROM room_users WHERE user_id = ?',
      [connection.userId]
    )

    const roomIds = (rows as { room_id: number }[]).map((r) => r.room_id)
    connection.roomIds = roomIds

    roomIds.forEach((roomId) => {
      if (!this.roomClients.has(roomId)) {
        this.roomClients.set(roomId, new Set())
      }
      this.roomClients.get(roomId)!.add(clientId)
    })

    this.broadcastOnlineUsers()
  }

  private handleMessage(clientId: string, data: RawData) {
    try {
      const message: WSMessageClient = JSON.parse(data.toString())
      const connection = this.clients.get(clientId)

      if (!connection) return

      switch (message.type) {
        case 'chat_message':
          this.handleChatMessage(clientId, message)
          break
        case 'join_room':
          this.handleJoinRoom(clientId, message.room_id!)
          break
      }
    } catch (error) {
      console.error('Message parse error:', error)
    }
  }

  private async handleChatMessage(clientId: string, message: WSMessageClient) {
    const connection = this.clients.get(clientId)
    if (!connection || !message.room_id || !message.content) return

    if (!connection.roomIds.includes(message.room_id)) {
      return
    }

    const [result] = await pool.execute(
      'INSERT INTO messages (room_id, user_id, content, message_type, emoji) VALUES (?, ?, ?, ?, ?)',
      [message.room_id, connection.userId, message.content, message.emoji ? 'emoji' : 'text', message.emoji || null]
    )

    const messageId = (result as any).insertId

    const response: WSMessageServer = {
      type: 'new_message',
      id: messageId,
      room_id: message.room_id,
      user_id: connection.userId,
      username: connection.username,
      content: message.content,
      emoji: message.emoji,
      created_at: new Date().toISOString(),
    }

    this.broadcastToRoom(message.room_id, response)
  }

  private async handleJoinRoom(clientId: string, roomId: number) {
    const connection = this.clients.get(clientId)
    if (!connection) return

    if (connection.roomIds.includes(roomId)) return

    try {
      await pool.execute(
        'INSERT INTO room_users (room_id, user_id) VALUES (?, ?)',
        [roomId, connection.userId]
      )

      connection.roomIds.push(roomId)

      if (!this.roomClients.has(roomId)) {
        this.roomClients.set(roomId, new Set())
      }
      this.roomClients.get(roomId)!.add(clientId)

      this.broadcastOnlineUsers()
    } catch (error) {
      console.error('Join room error:', error)
    }
  }

  private handleDisconnect(clientId: string) {
    const connection = this.clients.get(clientId)

    if (connection) {
      connection.roomIds.forEach((roomId) => {
        this.roomClients.get(roomId)?.delete(clientId)
      })
      this.clients.delete(clientId)
      this.broadcastOnlineUsers()
    }
  }

  private broadcastToRoom(roomId: number, message: WSMessageServer) {
    const clients = this.roomClients.get(roomId)
    if (!clients) return

    clients.forEach((clientId) => {
      const connection = this.clients.get(clientId)
      if (connection && connection.ws.readyState === 1) {
        connection.ws.send(JSON.stringify(message))
      }
    })
  }

  private broadcastOnlineUsers() {
    const onlineUsers = new Set<string>()
    
    this.clients.forEach((connection) => {
      onlineUsers.add(connection.username)
    })

    const response: WSMessageServer = {
      type: 'online_users',
      online_users: Array.from(onlineUsers),
    }

    this.clients.forEach((connection) => {
      if (connection.ws.readyState === 1) {
        connection.ws.send(JSON.stringify(response))
      }
    })
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
}

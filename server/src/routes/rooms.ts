import express from 'express'
import { pool } from '../db/connection'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.* FROM rooms r
      JOIN room_users ru ON r.id = ru.room_id
      WHERE ru.user_id = ?
      ORDER BY r.updated_at DESC
    `, [req.user!.id])

    res.json({ rooms: rows })
  } catch (error) {
    res.status(500).json({ detail: 'Internal server error' })
  }
})

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ detail: 'Room name is required' })
    }

    const [result] = await pool.execute(
      'INSERT INTO rooms (name, description) VALUES (?, ?)',
      [name, description || '']
    )

    const roomId = (result as any).insertId

    await pool.execute(
      'INSERT INTO room_users (room_id, user_id) VALUES (?, ?)',
      [roomId, req.user!.id]
    )

    const [rows] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [roomId])
    const room = (rows as any)[0]

    res.status(201).json({ room })
  } catch (error) {
    res.status(500).json({ detail: 'Internal server error' })
  }
})

router.post('/join', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { room_id } = req.body

    if (!room_id) {
      return res.status(400).json({ detail: 'Room ID is required' })
    }

    const [roomRows] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [room_id])
    
    if ((roomRows as any[]).length === 0) {
      return res.status(404).json({ detail: 'Room not found' })
    }

    try {
      await pool.execute(
        'INSERT INTO room_users (room_id, user_id) VALUES (?, ?)',
        [room_id, req.user!.id]
      )
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ detail: 'Already joined this room' })
      }
      throw error
    }

    const [rows] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [room_id])
    const room = (rows as any)[0]

    res.json({ room })
  } catch (error) {
    res.status(500).json({ detail: 'Internal server error' })
  }
})

router.get('/:roomId/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const roomId = parseInt(req.params.roomId)

    const [rows] = await pool.execute(`
      SELECT m.*, u.username FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.created_at ASC
      LIMIT 100
    `, [roomId])

    res.json({ messages: rows })
  } catch (error) {
    res.status(500).json({ detail: 'Internal server error' })
  }
})

export default router

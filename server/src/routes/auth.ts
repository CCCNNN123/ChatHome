import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db/connection'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    console.log('Register request body:', req.body)
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ detail: 'Username and password are required' })
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ detail: 'Username must be 3-50 characters' })
    }

    if (password.length < 4) {
      return res.status(400).json({ detail: 'Password must be at least 4 characters' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const [result] = await pool.execute(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashedPassword, username]
    )

    const userId = (result as any).insertId

    // @ts-ignore
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    const [rows] = await pool.execute(
      'SELECT id, username, nickname, avatar, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    )

    const user = (rows as any)[0]

    console.log('User registered:', user)
    res.status(201).json({ user, token })
  } catch (error: any) {
    console.error('Register error:', error)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ detail: 'Username already exists' })
    }
    res.status(500).json({ detail: 'Internal server error', error: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ detail: 'Username and password are required' })
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )

    const user = (rows as any)[0]

    if (!user) {
      return res.status(401).json({ detail: 'Invalid username or password' })
    }

    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({ detail: 'Invalid username or password' })
    }

    // @ts-ignore
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    const safeUser = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }

    res.json({ user: safeUser, token })
  } catch (error) {
    res.status(500).json({ detail: 'Internal server error' })
  }
})

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, nickname, avatar, created_at, updated_at FROM users WHERE id = ?',
      [req.user!.id]
    )

    const user = (rows as any)[0]

    if (!user) {
      return res.status(404).json({ detail: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    res.status(500).json({ detail: 'Internal server error' })
  }
})

export default router

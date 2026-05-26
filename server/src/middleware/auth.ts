import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { pool } from '../db/connection'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    username: string
  }
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ detail: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number }
    
    const [rows] = await pool.execute('SELECT id, username FROM users WHERE id = ?', [decoded.id])
    const user = (rows as { id: number; username: string }[])[0]
    
    if (!user) {
      return res.status(401).json({ detail: 'Unauthorized' })
    }
    
    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ detail: 'Invalid token' })
  }
}

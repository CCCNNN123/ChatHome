import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase, createDatabaseIfNotExists } from './db/connection'
import { ChatServer } from './ws/ChatServer'
import authRoutes from './routes/auth'
import roomRoutes from './routes/rooms'
import aiRoutes from './routes/ai'
import knowledgeRoutes from './routes/knowledge'

dotenv.config()

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const corsOrigin = process.env.CORS_ORIGIN || '*'
app.use(cors({ origin: corsOrigin }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/knowledge', knowledgeRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

new ChatServer(wss)

const PORT = process.env.PORT || 8000

async function start() {
  try {
    await createDatabaseIfNotExists()
    await initDatabase()
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
      console.log(`WebSocket server running on ws://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()

import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { pool } from '../db/connection'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `${uniqueSuffix}-${file.originalname}`)
  },
})

const upload = multer({ storage })

router.get('/documents', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM knowledge_docs ORDER BY created_at DESC')
    res.json({ documents: rows })
  } catch (error) {
    res.status(500).json({ detail: 'Internal server error' })
  }
})

router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' })
    }

    const { filename, path: filePath } = req.file

    const [result] = await pool.execute(
      'INSERT INTO knowledge_docs (filename, file_path, chunk_count) VALUES (?, ?, ?)',
      [filename, filePath, 0]
    )

    const docId = (result as any).insertId

    const [rows] = await pool.execute('SELECT * FROM knowledge_docs WHERE id = ?', [docId])
    const document = (rows as any)[0]

    res.json({ document })
  } catch (error) {
    res.status(500).json({ detail: 'Internal server error' })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id)

    const [rows] = await pool.execute('SELECT file_path FROM knowledge_docs WHERE id = ?', [id])
    const doc = (rows as any)[0]

    if (!doc) {
      return res.status(404).json({ detail: 'Document not found' })
    }

    fs.unlinkSync(doc.file_path)

    await pool.execute('DELETE FROM knowledge_docs WHERE id = ?', [id])

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ detail: 'Internal server error' })
  }
})

export default router

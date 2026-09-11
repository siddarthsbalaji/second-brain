import { Router, type Request } from 'express'
import { db } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'
import multer from 'multer'
import { getStorageBucket } from '../lib/firebase'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

const upload = multer({ storage: multer.memoryStorage() })

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    const { noteId, taskId } = req.body
    const originalName = req.file.originalname
    const size = req.file.size
    const mimeType = req.file.mimetype

    const bucket = getStorageBucket()
    if (!bucket) {
      res.status(500).json({ error: 'Storage bucket not configured' })
      return
    }

    const ext = path.extname(originalName) || ''
    const safeName = uuidv4() + ext
    const storagePath = `users/${userId}/attachments/${safeName}`

    const file = bucket.file(storagePath)
    await file.save(req.file.buffer, {
      metadata: { contentType: mimeType },
    })

    const ref = db.collection('attachments').doc()
    const data = {
      user_id: userId,
      note_id: noteId || null,
      task_id: taskId || null,
      filename: originalName,
      filepath: storagePath,
      mime_type: mimeType,
      size,
      created_at: new Date().toISOString()
    }
    
    await ref.set(data)
    res.status(201).json({ attachment: { id: ref.id, ...data } })
  })
)

router.get(
  '/:id/url',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string

    const ref = db.collection('attachments').doc(id)
    const doc = await ref.get()
    
    if (!doc.exists || doc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Attachment not found' })
      return
    }

    const bucket = getStorageBucket()
    if (!bucket) {
      res.status(500).json({ error: 'Storage bucket not configured' })
      return
    }

    const file = bucket.file(doc.data()!.filepath)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, 
    })

    res.json({ url })
  })
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string

    const ref = db.collection('attachments').doc(id)
    const doc = await ref.get()
    
    if (!doc.exists || doc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Attachment not found' })
      return
    }

    const bucket = getStorageBucket()
    if (bucket) {
      try {
        await bucket.file(doc.data()!.filepath).delete()
      } catch (err) {
        console.error('Failed to delete file from storage', err)
      }
    }

    await ref.delete()
    res.status(204).send()
  })
)

export default router

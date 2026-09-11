import { Router, type Request } from 'express'
import { folderRowToJson } from '../domain/folderRow'
import { db } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const snap = await db.collection('folders')
      .where('user_id', '==', userId)
      .get()

    const folders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json({ folders: folders.map(f => folderRowToJson(f as any)) })
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!name) {
      res.status(400).json({ error: 'Folder name is required' })
      return
    }

    let parentId = typeof req.body?.parentId === 'string' ? req.body.parentId : null
    if (parentId) {
      const parentDoc = await db.collection('folders').doc(parentId).get()
      if (!parentDoc.exists || parentDoc.data()?.user_id !== userId) {
        res.status(400).json({ error: 'Invalid parent folder' })
        return
      }
    }

    const ref = db.collection('folders').doc()
    const now = new Date().toISOString()
    const data = {
      user_id: userId,
      name,
      parent_id: parentId,
      created_at: now,
      updated_at: now
    }

    await ref.set(data)
    res.status(201).json({ folder: folderRowToJson({ id: ref.id, ...data } as any) })
  })
)

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string

    const ref = db.collection('folders').doc(id)
    const doc = await ref.get()
    
    if (!doc.exists || doc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Folder not found' })
      return
    }

    const updates: any = { updated_at: new Date().toISOString() }

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim()
      if (!name) return res.status(400).json({ error: 'Folder name cannot be empty' })
      updates.name = name
    }

    if (req.body?.parentId !== undefined) {
      const pid = req.body.parentId === null ? null : String(req.body.parentId)
      if (pid) {
        if (pid === id) return res.status(400).json({ error: 'Folder cannot be its own parent' })
        const parentDoc = await db.collection('folders').doc(pid).get()
        if (!parentDoc.exists || parentDoc.data()?.user_id !== userId) {
          return res.status(400).json({ error: 'Invalid parent folder' })
        }
      }
      updates.parent_id = pid
    }

    await ref.update(updates)
    const updated = await ref.get()
    res.json({ folder: folderRowToJson({ id: updated.id, ...updated.data() } as any) })
  })
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    
    const ref = db.collection('folders').doc(id)
    const doc = await ref.get()
    
    if (!doc.exists || doc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Folder not found' })
      return
    }

    // Check if it has children
    const childrenSnap = await db.collection('folders')
      .where('user_id', '==', userId)
      .where('parent_id', '==', id)
      .get()
      
    if (!childrenSnap.empty) {
      res.status(400).json({ error: 'Cannot delete a folder that contains subfolders' })
      return
    }

    const notesSnap = await db.collection('notes')
      .where('user_id', '==', userId)
      .where('folder_id', '==', id)
      .get()
      
    if (!notesSnap.empty) {
      res.status(400).json({ error: 'Cannot delete a folder that contains notes' })
      return
    }

    await ref.delete()
    res.status(204).send()
  })
)

export default router
import { Router, type Request } from 'express'
import { noteRowToDetail, noteRowToListItem } from '../domain/noteRow'
import { db, generateId } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'
import { NoteService } from '../domain/NoteService'
import { z } from 'zod'
import { validate } from '../middleware/validate'

const NoteValidationSchema = z.object({
  body: z.object({
    title: z.string().max(255).optional(),
    content: z.string().optional(),
    folderId: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
  })
})

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

router.get(
  '/tags',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const tagsSnap = await db.collection('tags').where('user_id', '==', userId).get()
    const tags = tagsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    tags.sort((a: any, b: any) => (a.normalized_name || '').localeCompare(b.normalized_name || ''))
    res.json({ tags })
  })
)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const notesSnap = await db.collection('notes')
      .where('user_id', '==', userId)
      .get()
      
    const notes = notesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    notes.sort((a: any, b: any) => (b.updated_at || '').localeCompare(a.updated_at || ''))
    
    res.json({ notes: notes.map(n => noteRowToListItem(n as any)) })
  })
)

router.get(
  '/graph',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const notesSnap = await db.collection('notes').where('user_id', '==', userId).get()
    
    const nodes: any[] = []
    const links: any[] = []
    
    notesSnap.docs.forEach(doc => {
      const data = doc.data()
      nodes.push({ id: doc.id, title: data.title })
      if (Array.isArray(data.links)) {
        data.links.forEach((targetId: string) => {
          links.push({ source: doc.id, target: targetId })
        })
      }
    })
    
    res.json({ nodes, links })
  })
)

router.post(
  '/',
  validate(NoteValidationSchema),
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : 'Untitled Note'
    const content = typeof req.body?.content === 'string' ? req.body.content : ''
    let folderId = typeof req.body?.folderId === 'string' ? req.body.folderId : null
    
    if (folderId) {
      const folderDoc = await db.collection('folders').doc(folderId).get()
      if (!folderDoc.exists || folderDoc.data()?.user_id !== userId) {
        folderId = null
      }
    }

    const slug = await NoteService.nextUniqueSlug(userId, title, null)
    
    const noteRef = db.collection('notes').doc()
    const now = new Date().toISOString()
    const noteData = {
      user_id: userId,
      title,
      slug,
      content,
      folder_id: folderId,
      created_at: now,
      updated_at: now,
      tags: [],
      links: []
    }
    
    await noteRef.set(noteData)

    const tags = Array.isArray(req.body?.tags) ? req.body.tags : []
    await NoteService.syncNoteTags(userId, noteRef.id, tags)
    await NoteService.syncNoteLinks(userId, noteRef.id, content)

    const detail = await NoteService.fetchNoteDetail(userId, noteRef.id)
    res.status(201).json({ note: noteRowToDetail(detail as any) })
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    const detail = await NoteService.fetchNoteDetail(userId, id)
    if (!detail) {
      res.status(404).json({ error: 'Note not found' })
      return
    }
    res.json({ note: noteRowToDetail(detail as any) })
  })
)

router.patch(
  '/:id',
  validate(NoteValidationSchema),
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    
    const noteRef = db.collection('notes').doc(id)
    const noteDoc = await noteRef.get()
    
    if (!noteDoc.exists || noteDoc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    const updates: any = { updated_at: new Date().toISOString() }
    let titleChanged = false

    if (req.body?.title !== undefined) {
      updates.title = String(req.body.title).trim() || 'Untitled Note'
      titleChanged = true
    }
    if (req.body?.content !== undefined) {
      updates.content = String(req.body.content)
    }
    if (req.body?.folderId !== undefined) {
      let fId = req.body.folderId === null ? null : String(req.body.folderId)
      if (fId) {
        const folderDoc = await db.collection('folders').doc(fId).get()
        if (!folderDoc.exists || folderDoc.data()?.user_id !== userId) fId = null
      }
      updates.folder_id = fId
    }

    if (titleChanged) {
      updates.slug = await NoteService.nextUniqueSlug(userId, updates.title, id)
    }

    await noteRef.update(updates)

    if (req.body?.tags !== undefined && Array.isArray(req.body.tags)) {
      await NoteService.syncNoteTags(userId, id, req.body.tags)
    }

    const finalContent = updates.content !== undefined ? updates.content : noteDoc.data()?.content || ''
    await NoteService.syncNoteLinks(userId, id, finalContent)

    const detail = await NoteService.fetchNoteDetail(userId, id)
    res.json({ note: noteRowToDetail(detail as any) })
  })
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    
    const noteRef = db.collection('notes').doc(id)
    const noteDoc = await noteRef.get()
    
    if (!noteDoc.exists || noteDoc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    await noteRef.delete()
    res.status(204).send()
  })
)

export default router
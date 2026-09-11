import { Router, type Request } from 'express'
import { eventRowToJson } from '../domain/eventRow'
import { db } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

function parseDate(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    
    // Cloud Firestore doesn't easily support querying by overlap (starts_at < end AND ends_at > start) natively.
    // For small personal DBs, we fetch all events in the time horizon.
    const startRange = parseDate(req.query.start)
    const endRange = parseDate(req.query.end)
    
    let query = db.collection('events').where('user_id', '==', userId)
    
    // Best effort bounds
    if (startRange) {
      query = query.where('ends_at', '>=', startRange)
    }

    const snap = await query.get()
    let events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (endRange) {
      events = events.filter((e: any) => e.starts_at <= endRange)
    }

    res.json({ events: events.map(e => eventRowToJson(e as any)) })
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
    if (!title) {
      res.status(400).json({ error: 'Title is required' })
      return
    }

    const startsAt = parseDate(req.body?.startsAt)
    const endsAt = parseDate(req.body?.endsAt)
    if (!startsAt || !endsAt) {
      res.status(400).json({ error: 'startsAt and endsAt are required valid dates' })
      return
    }

    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : null
    const allDay = req.body?.allDay === true
    const recurrenceRule = req.body?.recurrenceRule || null

    const ref = db.collection('events').doc()
    const now = new Date().toISOString()
    const data = {
      user_id: userId,
      title,
      description,
      starts_at: startsAt,
      ends_at: endsAt,
      all_day: allDay,
      recurrence_rule: recurrenceRule,
      created_at: now,
      updated_at: now
    }
    
    await ref.set(data)
    res.status(201).json({ event: eventRowToJson({ id: ref.id, ...data } as any) })
  })
)

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    
    const ref = db.collection('events').doc(id)
    const doc = await ref.get()
    
    if (!doc.exists || doc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Event not found' })
      return
    }

    const updates: any = { updated_at: new Date().toISOString() }

    if (req.body?.title !== undefined) {
      const t = String(req.body.title).trim()
      if (!t) return res.status(400).json({ error: 'Title cannot be empty' })
      updates.title = t
    }
    if (req.body?.description !== undefined) {
      updates.description = typeof req.body.description === 'string' ? req.body.description.trim() || null : null
    }
    if (req.body?.startsAt !== undefined) {
      const d = parseDate(req.body.startsAt)
      if (!d) return res.status(400).json({ error: 'Invalid startsAt' })
      updates.starts_at = d
    }
    if (req.body?.endsAt !== undefined) {
      const d = parseDate(req.body.endsAt)
      if (!d) return res.status(400).json({ error: 'Invalid endsAt' })
      updates.ends_at = d
    }
    if (req.body?.allDay !== undefined) {
      updates.all_day = Boolean(req.body.allDay)
    }
    if (req.body?.recurrenceRule !== undefined) {
      updates.recurrence_rule = req.body.recurrenceRule || null
    }

    await ref.update(updates)
    const updated = await ref.get()
    res.json({ event: eventRowToJson({ id: updated.id, ...updated.data() } as any) })
  })
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    
    const ref = db.collection('events').doc(id)
    const doc = await ref.get()
    
    if (!doc.exists || doc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Event not found' })
      return
    }

    await ref.delete()
    res.status(204).send()
  })
)

export default router
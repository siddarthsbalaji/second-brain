import { Router, type Request } from 'express'
import { journalRowToJson } from '../domain/journalRow'
import { db } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'
import { z } from 'zod'

const JournalValidationSchema = z.object({
  title: z.string().max(255).optional(),
  bodyHtml: z.string().optional(),
  bodyText: z.string().optional(),
})

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    let limit = 20
    const limitRaw = Number(req.query.limit)
    if (Number.isFinite(limitRaw) && limitRaw > 0) {
      limit = Math.min(100, Math.floor(limitRaw))
    }
    const month = req.query.month as string

    let query = db.collection('journal_entries')
      .where('user_id', '==', userId)
      // fetch all for user to sort in memory since no composite index is defined

    const snap = await query.get()
    
    let entries = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // sort in memory
    entries.sort((a: any, b: any) => {
      const dateA = a.entry_date || ''
      const dateB = b.entry_date || ''
      return dateB.localeCompare(dateA) // desc
    })

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      entries = entries.filter((e: any) => e.entry_date && e.entry_date.startsWith(month))
    } else {
      entries = entries.slice(0, limit)
    }

    res.json({ month, entries: entries.map(e => journalRowToJson(e as any)) })
  })
)

router.get(
  '/:date',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const date = req.params.date as string
    if (!DATE_REGEX.test(date)) {
      res.status(400).json({ error: 'Date must be YYYY-MM-DD' })
      return
    }

    const snap = await db.collection('journal_entries')
      .where('user_id', '==', userId)
      .where('entry_date', '==', date)
      .limit(1)
      .get()

    if (snap.empty) {
      res.json({ entry: null })
      return
    }

    const doc = snap.docs[0]
    res.json({ entry: journalRowToJson({ id: doc.id, ...doc.data() } as any) })
  })
)

router.put(
  '/:date',
  asyncHandler(async (req, res) => {
    try {
      JournalValidationSchema.parse(req.body)
    } catch (e) {
      res.status(400).json({ error: 'Validation failed' })
      return
    }

    const userId = userIdFrom(req)
    const date = req.params.date as string
    if (!DATE_REGEX.test(date)) {
      res.status(400).json({ error: 'Date must be YYYY-MM-DD' })
      return
    }

    const snap = await db.collection('journal_entries')
      .where('user_id', '==', userId)
      .where('entry_date', '==', date)
      .limit(1)
      .get()

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
    const bodyHtml = typeof req.body.bodyHtml === 'string' ? req.body.bodyHtml : ''
    const bodyText = typeof req.body.bodyText === 'string' ? req.body.bodyText : ''
    const now = new Date().toISOString()

    let docId: string
    let data: any

    if (snap.empty) {
      const docRef = db.collection('journal_entries').doc()
      docId = docRef.id
      data = {
        user_id: userId,
        entry_date: date,
        title,
        body_html: bodyHtml,
        body_text: bodyText,
        created_at: now,
        updated_at: now
      }
      await docRef.set(data)
    } else {
      docId = snap.docs[0].id
      data = {
        ...snap.docs[0].data(),
        title,
        body_html: bodyHtml,
        body_text: bodyText,
        updated_at: now
      }
      await db.collection('journal_entries').doc(docId).update({
        title,
        body_html: bodyHtml,
        body_text: bodyText,
        updated_at: now
      })
    }

    res.json({ entry: journalRowToJson({ id: docId, ...data }) })
  })
)

export default router
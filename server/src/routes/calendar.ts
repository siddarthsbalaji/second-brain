import { Router, type Request } from 'express'
import { expandRecurringEvents } from '../lib/recurrence'
import { eventRowToJson } from '../domain/eventRow'
import { taskRowToJson } from '../domain/taskRow'
import { journalRowToJson } from '../domain/journalRow'
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
  '/range',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const startRange = parseDate(req.query.start)
    const endRange = parseDate(req.query.end)
    
    if (!startRange || !endRange) {
      res.status(400).json({ error: 'start and end dates are required' })
      return
    }

    const [eventsSnap, tasksSnap, journalsSnap] = await Promise.all([
      db.collection('events')
        .where('user_id', '==', userId)
        .get(),
      db.collection('tasks')
        .where('user_id', '==', userId)
        .get(),
      db.collection('journal_entries')
        .where('user_id', '==', userId)
        .get()
    ])

    // Fetch and process events
    const rawEvents = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // First, separate one-off events that are outside the range vs recurring events
    const validRawEvents = rawEvents.filter((e: any) => {
      // If it's a recurring event, keep it for the expansion function to decide
      if (e.recurrence_rule && e.recurrence_rule.frequency !== 'none') {
        return true
      }
      // Otherwise, just check normal intersection
      return e.ends_at >= startRange && e.starts_at <= endRange
    })

    const startRangeDate = new Date(startRange)
    const endRangeDate = new Date(endRange)

    const expandedEvents = expandRecurringEvents(validRawEvents, startRangeDate, endRangeDate)
    
    // expandRecurringEvents returns ExpandedEventJson[] which is already in camelCase and serialized.
    // However, eventRowToJson expects snake_case for single events, but expandRecurringEvents already formats them properly!
    // So we can just use the output of expandRecurringEvents.
    const events = expandedEvents

    const tasks = tasksSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((t: any) => t.due_at >= startRange && t.due_at <= endRange)
      .map(t => taskRowToJson(t.id, t))

    const endDateStr = endRange.split('T')[0]
    const startDateStr = startRange.split('T')[0]
    const journals = journalsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((j: any) => j.entry_date >= startDateStr && j.entry_date <= endDateStr)
      .map(j => journalRowToJson(j as any))

    res.json({ events, tasks, journals })
  })
)

export default router
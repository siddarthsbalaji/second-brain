import { Router, type Request } from 'express'
import { db } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'

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
    const habitsSnap = await db.collection('habits').where('user_id', '==', userId).get()
    
    // For habits, we fetch their logs for the current month roughly, or we just fetch all logs if small
    // Here we will just fetch all logs for this user's habits (or we could fetch logs separately)
    const habits = habitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    const logsSnap = await db.collection('habit_logs').where('user_id', '==', userId).get()
    const logsByHabit: Record<string, any[]> = {}
    
    logsSnap.docs.forEach(doc => {
      const log = doc.data()
      if (!logsByHabit[log.habit_id]) logsByHabit[log.habit_id] = []
      logsByHabit[log.habit_id].push({
        id: doc.id,
        date: log.date,
        completed: log.completed
      })
    })

    const finalHabits = habits.map((h: any) => ({
      id: h.id,
      name: h.name,
      frequency: h.frequency,
      createdAt: h.created_at,
      logs: (logsByHabit[h.id] || []).sort((a, b) => b.date.localeCompare(a.date))
    }))

    finalHabits.sort((a, b) => a.name.localeCompare(b.name))
    res.json({ habits: finalHabits })
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!name) {
      res.status(400).json({ error: 'Habit name is required' })
      return
    }

    const frequency = req.body?.frequency === 'weekly' ? 'weekly' : 'daily'
    
    const ref = db.collection('habits').doc()
    const data = {
      user_id: userId,
      name,
      frequency,
      created_at: new Date().toISOString()
    }
    
    await ref.set(data)
    res.status(201).json({ habit: { id: ref.id, ...data, logs: [] } })
  })
)

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string

    const ref = db.collection('habits').doc(id)
    const doc = await ref.get()
    if (!doc.exists || doc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Habit not found' })
      return
    }

    const updates: any = {}
    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim()
      if (!name) return res.status(400).json({ error: 'Habit name cannot be empty' })
      updates.name = name
    }
    if (req.body?.frequency !== undefined) {
      updates.frequency = req.body.frequency === 'weekly' ? 'weekly' : 'daily'
    }

    if (Object.keys(updates).length > 0) {
      await ref.update(updates)
    }

    const updated = await ref.get()
    res.json({ habit: { id: updated.id, ...updated.data() } })
  })
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    
    const ref = db.collection('habits').doc(id)
    const doc = await ref.get()
    
    if (!doc.exists || doc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Habit not found' })
      return
    }

    // Cascade delete logs
    const logsSnap = await db.collection('habit_logs').where('habit_id', '==', id).get()
    const batch = db.batch()
    logsSnap.docs.forEach(logDoc => {
      batch.delete(logDoc.ref)
    })
    batch.delete(ref)
    await batch.commit()

    res.status(204).send()
  })
)

router.post(
  '/:id/toggle',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const habitId = req.params.id as string
    const date = req.body?.date as string

    if (!date || typeof date !== 'string' || !DATE_REGEX.test(date)) {
      res.status(400).json({ error: 'Invalid date (YYYY-MM-DD)' })
      return
    }

    const habitDoc = await db.collection('habits').doc(habitId).get()
    if (!habitDoc.exists || habitDoc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Habit not found' })
      return
    }

    const logId = `${habitId}_${date}`
    const logRef = db.collection('habit_logs').doc(logId)
    const logDoc = await logRef.get()
    
    let completed = true
    if (logDoc.exists) {
      completed = !logDoc.data()?.completed
    }
    
    const data = {
      user_id: userId,
      habit_id: habitId,
      date,
      completed
    }
    
    await logRef.set(data, { merge: true })
    res.json({ log: { id: logId, ...data } })
  })
)

export default router

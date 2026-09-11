import { Router, type Request } from 'express'
import { db, generateId } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'
import { z } from 'zod'
import { validate } from '../middleware/validate'

const TaskValidationSchema = z.object({
  body: z.object({
    title: z.string().max(255).optional(),
    description: z.string().max(10000).nullable().optional(),
    dueAt: z.union([z.string(), z.null()]).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    listId: z.string().nullable().optional(),
    status: z.enum(['open', 'in_progress', 'completed']).optional(),
    subtasks: z.array(z.any()).optional(),
    sortOrder: z.number().optional(),
  })
})

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

type Priority = 'low' | 'medium' | 'high'
function parsePriority(v: unknown): Priority | null {
  if (v === 'low' || v === 'medium' || v === 'high') return v
  return null
}

function parseDueAt(v: unknown): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  if (typeof v !== 'string') return undefined
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

function parseListId(v: unknown): string | null {
  if (typeof v !== 'string' || !v.trim()) return null
  return v
}

async function ensureListBelongsToUser(userId: string, listId: string): Promise<boolean> {
  const doc = await db.collection('task_lists').doc(listId).get()
  if (!doc.exists) return false
  return doc.data()?.user_id === userId
}

function taskRowToJson(docId: string, row: any) {
  let subtasks = []
  if (Array.isArray(row.subtasks)) {
    subtasks = row.subtasks
  }
  return {
    id: docId,
    title: row.title || '',
    description: row.description || null,
    dueAt: row.due_at || null,
    priority: row.priority || 'low',
    status: row.status || 'open',
    completedAt: row.completed_at || null,
    sortOrder: row.sort_order || 0,
    listId: row.task_list_id || null,
    subtasks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const statusFilter = req.query.status as string
    const listId = parseListId(req.query.listId)
    const limitRaw = Number(req.query.limit)
    const limit = Number.isFinite(limitRaw) ? Math.max(1, limitRaw) : 50

    let query: any = db.collection('tasks').where('user_id', '==', userId)
    
    if (statusFilter === 'open') {
      query = query.where('status', 'in', ['open', 'in_progress'])
    } else if (statusFilter === 'in_progress' || statusFilter === 'completed') {
      query = query.where('status', '==', statusFilter)
    }

    if (listId) {
      query = query.where('task_list_id', '==', listId)
    }

    // Note: complex sorting in Firestore usually requires composite indexes.
    // We'll sort in memory to avoid requiring users to manually create complex indexes immediately.
    const snapshot = await query.get()
    let tasks = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    
    tasks.sort((a: any, b: any) => {
      // sort by status desc, completed_at desc, due_at asc, sort_order asc, created_at asc
      if (a.status !== b.status) return b.status.localeCompare(a.status)
      if (a.completed_at !== b.completed_at) return String(b.completed_at || '').localeCompare(String(a.completed_at || ''))
      if (a.due_at !== b.due_at) return String(a.due_at || 'z').localeCompare(String(b.due_at || 'z'))
      if (a.sort_order !== b.sort_order) return (a.sort_order || 0) - (b.sort_order || 0)
      return String(a.created_at || '').localeCompare(String(b.created_at || ''))
    })

    const total = tasks.length
    const pagedTasks = tasks.slice(0, limit)

    res.json({ tasks: pagedTasks.map((t: any) => taskRowToJson(t.id, t)), total })
  })
)

router.post(
  '/',
  validate(TaskValidationSchema),
  asyncHandler(async (req, res) => {
    
    const userId = userIdFrom(req)
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
    
    if (!title) {
      res.status(400).json({ error: 'Title is required' })
      return
    }

    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : null
    let listId = parseListId(req.body?.listId)
    
    if (!listId || !(await ensureListBelongsToUser(userId, listId))) {
      const listsSnap = await db.collection('task_lists').where('user_id', '==', userId).orderBy('sort_order', 'asc').limit(1).get()
      if (listsSnap.empty) {
        const newListRef = db.collection('task_lists').doc()
        await newListRef.set({
          user_id: userId,
          name: 'Inbox',
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        listId = newListRef.id
      } else {
        listId = listsSnap.docs[0].id
      }
    }

    const priority = parsePriority(req.body?.priority) ?? 'low'
    const dueParsed = parseDueAt(req.body?.dueAt)
    if (dueParsed === undefined && req.body?.dueAt !== undefined && req.body?.dueAt !== null) {
      res.status(400).json({ error: 'Invalid dueAt; use ISO-8601 datetime or null' })
      return
    }
    const dueAt = dueParsed === undefined ? null : dueParsed

    const tasksSnap = await db.collection('tasks').where('user_id', '==', userId).get()
    const maxSort = tasksSnap.docs.reduce((max, doc) => Math.max(max, doc.data().sort_order || 0), 0)
    const sortOrder = maxSort + 1

    const newDocRef = db.collection('tasks').doc()
    const taskData = {
      user_id: userId,
      task_list_id: listId,
      title,
      description,
      due_at: dueAt,
      priority,
      status: 'open',
      completed_at: null,
      sort_order: sortOrder,
      subtasks: Array.isArray(req.body?.subtasks) ? req.body.subtasks : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    await newDocRef.set(taskData)

    res.status(201).json({ task: taskRowToJson(newDocRef.id, taskData) })
  })
)

router.patch(
  '/:id',
  validate(TaskValidationSchema),
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid task id' })
      return
    }

    const taskRef = db.collection('tasks').doc(id)
    const taskDoc = await taskRef.get()
    if (!taskDoc.exists || taskDoc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    const data: any = {}
    if (req.body?.title !== undefined) {
      if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
        res.status(400).json({ error: 'Title cannot be empty' })
        return
      }
      data.title = req.body.title.trim()
    }
    if (req.body?.description !== undefined) {
      data.description = typeof req.body.description === 'string' ? req.body.description.trim() || null : null
    }
    if (req.body?.dueAt !== undefined) {
      const dueParsed = parseDueAt(req.body.dueAt)
      if (dueParsed === undefined) {
        res.status(400).json({ error: 'Invalid dueAt' })
        return
      }
      data.due_at = dueParsed
    }
    if (req.body?.priority !== undefined) {
      const p = parsePriority(req.body.priority)
      if (!p) {
        res.status(400).json({ error: 'priority must be low, medium, or high' })
        return
      }
      data.priority = p
    }
    if (req.body?.listId !== undefined) {
      const listId = parseListId(req.body.listId)
      if (!listId || !(await ensureListBelongsToUser(userId, listId))) {
        res.status(400).json({ error: 'Invalid task list' })
        return
      }
      data.task_list_id = listId
    }
    if (req.body?.status !== undefined) {
      if (req.body.status !== 'open' && req.body.status !== 'in_progress' && req.body.status !== 'completed') {
        res.status(400).json({ error: 'status must be open, in_progress, or completed' })
        return
      }
      data.status = req.body.status
      if (req.body.status === 'completed') {
        data.completed_at = new Date().toISOString()
      } else {
        data.completed_at = null
      }
    }
    if (req.body?.subtasks !== undefined) {
      if (!Array.isArray(req.body.subtasks)) {
        res.status(400).json({ error: 'subtasks must be an array' })
        return
      }
      data.subtasks = req.body.subtasks
    }
    if (req.body?.sortOrder !== undefined) {
      if (typeof req.body.sortOrder !== 'number' || !Number.isFinite(req.body.sortOrder)) {
        res.status(400).json({ error: 'sortOrder must be a number' })
        return
      }
      data.sort_order = Math.round(req.body.sortOrder)
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' })
      return
    }

    data.updated_at = new Date().toISOString()
    await taskRef.update(data)
    
    const updatedDoc = await taskRef.get()
    res.json({ task: taskRowToJson(updatedDoc.id, updatedDoc.data()) })
  })
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    const taskRef = db.collection('tasks').doc(id)
    const taskDoc = await taskRef.get()
    
    if (!taskDoc.exists || taskDoc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Task not found' })
      return
    }
    
    await taskRef.delete()
    res.status(204).send()
  })
)

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const snap = await db.collection('tasks').where('user_id', '==', userId).get()
    
    let totalOpen = 0
    let totalCompleted = 0
    const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0 }

    snap.forEach(doc => {
      const data = doc.data()
      if (data.status === 'completed') {
        totalCompleted++
      } else {
        totalOpen++
        const prio = data.priority || 'low'
        if (byPriority[prio] !== undefined) {
          byPriority[prio]++
        }
      }
    })

    res.json({
      totalOpen,
      totalCompleted,
      byPriority,
    })
  })
)

router.get(
  '/lists',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const listsSnap = await db.collection('task_lists').where('user_id', '==', userId).get()
    
    const lists = listsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    lists.sort((a: any, b: any) => {
      if (a.sort_order !== b.sort_order) return (a.sort_order || 0) - (b.sort_order || 0)
      return (a.name || '').localeCompare(b.name || '')
    })

    res.json({ lists })
  })
)

router.post(
  '/lists',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    
    if (!name) {
      res.status(400).json({ error: 'List name is required' })
      return
    }

    const listsSnap = await db.collection('task_lists').where('user_id', '==', userId).get()
    const maxSort = listsSnap.docs.reduce((max, doc) => Math.max(max, doc.data().sort_order || 0), 0)
    
    const sortOrder = maxSort + 1
    const listRef = db.collection('task_lists').doc()
    
    const listData = {
      user_id: userId,
      name,
      sort_order: sortOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    await listRef.set(listData)
    res.status(201).json({ list: { id: listRef.id, ...listData } })
  })
)

router.patch(
  '/lists/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    
    if (!name) {
      res.status(400).json({ error: 'List name is required' })
      return
    }

    const listRef = db.collection('task_lists').doc(id)
    const listDoc = await listRef.get()
    
    if (!listDoc.exists || listDoc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Task list not found' })
      return
    }
    
    await listRef.update({ name, updated_at: new Date().toISOString() })
    const updated = await listRef.get()
    
    res.json({ list: { id: updated.id, ...updated.data() } })
  })
)

router.delete(
  '/lists/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    
    const taskCount = (await db.collection('tasks')
      .where('user_id', '==', userId)
      .where('task_list_id', '==', id).get()).size
      
    if (taskCount > 0) {
      res.status(400).json({ error: 'Cannot delete a list with tasks' })
      return
    }
    
    const listRef = db.collection('task_lists').doc(id)
    const listDoc = await listRef.get()
    if (!listDoc.exists || listDoc.data()?.user_id !== userId) {
      res.status(404).json({ error: 'Task list not found' })
      return
    }

    await listRef.delete()
    res.status(204).send()
  })
)

export default router
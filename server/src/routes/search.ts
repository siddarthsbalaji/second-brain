import { Router, type Request } from 'express'
import { db } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

function getSnippet(text: string, query: string): string {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lowerText.indexOf(lowerQuery)
  
  if (idx === -1) {
    return text.slice(0, 150) + (text.length > 150 ? '...' : '')
  }

  const start = Math.max(0, idx - 60)
  const end = Math.min(text.length, idx + query.length + 60)
  
  let snippet = text.slice(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'
  
  return snippet
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 240) : ''
    const limitRaw = Number(req.query.limit)
    const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.floor(limitRaw))) : 25

    if (!q) {
      res.json({ results: [] })
      return
    }

    const lowerQ = q.toLowerCase()

    try {
      // In a real production app with massive data, we'd use Algolia or Elastic.
      // For personal second brains, fetching user's notes into memory is fast and cheap.
      const [notesSnap, journalsSnap] = await Promise.all([
        db.collection('notes').where('user_id', '==', userId).get(),
        db.collection('journal_entries').where('user_id', '==', userId).get()
      ])

      const hits: any[] = []

      notesSnap.forEach(doc => {
        const data = doc.data()
        const title = data.title || ''
        const content = data.content || ''
        
        if (title.toLowerCase().includes(lowerQ) || content.toLowerCase().includes(lowerQ)) {
          hits.push({
            type: 'note',
            id: doc.id,
            title,
            snippet: getSnippet(content, q),
            rank: title.toLowerCase().includes(lowerQ) ? 2 : 1,
            entryDate: null
          })
        }
      })

      journalsSnap.forEach(doc => {
        const data = doc.data()
        const title = data.title || data.entry_date
        const content = data.body_text || ''
        
        if (title.toLowerCase().includes(lowerQ) || content.toLowerCase().includes(lowerQ)) {
          hits.push({
            type: 'journal',
            id: doc.id,
            title,
            snippet: getSnippet(content, q),
            rank: title.toLowerCase().includes(lowerQ) ? 2 : 1,
            entryDate: data.entry_date
          })
        }
      })

      // Sort by rank desc, then title asc
      hits.sort((a, b) => {
        if (a.rank !== b.rank) return b.rank - a.rank
        return a.title.localeCompare(b.title)
      })

      res.json({ results: hits.slice(0, limit) })
    } catch (err) {
      console.error(err)
      res.status(400).json({ error: 'Search failed' })
    }
  })
)

export default router
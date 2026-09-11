import { db } from '../db'
import { slugify } from '../lib/slug'
import { extractWikiTargets } from '../lib/wikiLinks'
import { FieldValue } from 'firebase-admin/firestore'

function normalizeTagName(name: string) {
  return name.trim()
}

export class NoteService {
  static async nextUniqueSlug(userId: string, base: string, excludeId: string | null): Promise<string> {
    let slug = slugify(base)
    let i = 0
    for (;;) {
      let query = db.collection('notes')
        .where('user_id', '==', userId)
        .where('slug', '==', slug)

      const snap = await query.get()
      const conflict = snap.docs.find(doc => doc.id !== excludeId)
      
      if (!conflict) return slug
      i += 1
      slug = `${slugify(base)}-${i}`
    }
  }

  static async syncNoteLinks(userId: string, fromNoteId: string, content: string) {
    const targets = extractWikiTargets(content).map((t) => t.trim()).filter(Boolean)
    if (targets.length === 0) {
      await db.collection('notes').doc(fromNoteId).update({ links: [] })
      return
    }

    const slugs = targets.map(slugify)
    const rawNames = targets.map((t) => t.toLowerCase())
    
    // In Firestore, we have to fetch notes and filter them or do individual gets
    const notesSnap = await db.collection('notes').where('user_id', '==', userId).get()
    
    const toIds = new Set<string>()
    notesSnap.forEach(doc => {
      const data = doc.data()
      if (doc.id !== fromNoteId && (slugs.includes(data.slug) || rawNames.includes(String(data.title).trim().toLowerCase()))) {
        toIds.add(doc.id)
      }
    })

    await db.collection('notes').doc(fromNoteId).update({
      links: Array.from(toIds)
    })
  }

  static async syncNoteTags(userId: string, noteId: string, tags: readonly string[]) {
    const cleaned = tags.map(normalizeTagName).filter((tag) => tag.length > 0)
    const uniqueTags = Array.from(new Set(cleaned.map((tag) => tag.toLowerCase()))).map(
      (lower) => cleaned.find((tag) => tag.toLowerCase() === lower) as string
    )
    
    // Create/update tags globally for user
    const batch = db.batch()
    for (const name of uniqueTags) {
      const normalizedName = name.toLowerCase()
      // Use normalized name as document id to prevent duplicates
      const tagRef = db.collection('tags').doc(`${userId}_${normalizedName}`)
      batch.set(tagRef, {
        user_id: userId,
        name: name,
        normalized_name: normalizedName,
        updated_at: new Date().toISOString()
      }, { merge: true })
    }
    await batch.commit()

    // Update note with string array of tags
    await db.collection('notes').doc(noteId).update({
      tags: uniqueTags
    })
  }

  static async fetchNoteDetail(userId: string, id: string) {
    const noteDoc = await db.collection('notes').doc(id).get()
    if (!noteDoc.exists || noteDoc.data()?.user_id !== userId) return null
    const data = noteDoc.data()!
    return {
      id: noteDoc.id,
      ...data,
      tags: (data.tags || []).sort()
    }
  }
}

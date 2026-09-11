import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { requireAuth, signToken, type AuthedRequest } from '../middleware/auth'
import { adminAuth } from '../lib/firebase'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null
  const e = email.trim().toLowerCase()
  return EMAIL_RE.test(e) ? e : null
}

async function verifyGoogleToken(
  idToken: string
): Promise<{ email: string; name?: string; given_name?: string; uid?: string } | null> {
  // 1. Try Firebase Admin if configured
  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken)
      if (decoded && decoded.email) {
        return {
          email: decoded.email.toLowerCase().trim(),
          name: decoded.name,
          given_name: decoded.name?.split(' ')[0],
          uid: decoded.uid,
        }
      }
    } catch {}
  }

  // 2. Try Google OAuth tokeninfo endpoint
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
    if (res.ok) {
      const payload = (await res.json()) as any
      if (payload.email && (payload.email_verified === 'true' || payload.email_verified === true)) {
        const expectedAud = process.env.GOOGLE_CLIENT_ID
        if (expectedAud && payload.aud !== expectedAud) {
          console.warn('Google token audience mismatch:', payload.aud, 'expected:', expectedAud)
          return null
        }
        return {
          email: payload.email.toLowerCase().trim(),
          name: payload.name,
          given_name: payload.given_name,
          uid: payload.sub,
        }
      }
    }
  } catch (err) {
    console.error('Google tokeninfo fetch failed:', err)
  }

  // 3. Fallback / Development decoding
  try {
    const decoded = jwt.decode(idToken) as any
    if (decoded && decoded.email) {
      return {
        email: String(decoded.email).toLowerCase().trim(),
        name: decoded.name,
        given_name: decoded.given_name,
        uid: decoded.sub || decoded.uid,
      }
    }
  } catch {}

  return null
}

// Sync authenticated user with Firestore (called after Firebase onAuthStateChanged)
router.post(
  '/sync',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest
    const userDoc = await db.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    const userData = userDoc.data()!
    const isNewUser = !userData.username
    res.json({
      user: {
        id: userDoc.id,
        email: userData.email,
        username: userData.username,
        createdAt: userData.created_at || new Date().toISOString(),
      },
      isNewUser,
      suggestedUsername: userData.username || userData.email.split('@')[0],
    })
  })
)

router.post(
  '/google',
  asyncHandler(async (req, res) => {
    const credential = req.body?.credential
    let email: string | null = null
    let name: string | undefined
    let given_name: string | undefined
    let uid: string | undefined

    if (typeof credential === 'string' && credential.length > 0) {
      const verified = await verifyGoogleToken(credential)
      if (verified) {
        email = verified.email
        name = verified.name
        given_name = verified.given_name
        uid = verified.uid
      }
    }

    if (!email && process.env.NODE_ENV !== 'production' && req.body?.devBypass) {
      email = normalizeEmail(req.body?.email) || 'demo.user@example.com'
      const fallbackName = typeof req.body?.name === 'string' ? req.body.name : 'Demo User'
      name = fallbackName
      given_name = fallbackName.split(' ')[0]
    }

    if (!email) {
      res.status(401).json({ error: 'Invalid or unverifiable Google credentials' })
      return
    }

    let userDocId: string | null = null
    let userData: any = null

    // Find by firebase_uid or email
    let usersQuery = await db.collection('users').where('email', '==', email).limit(1).get()
    
    if (!usersQuery.empty) {
      userDocId = usersQuery.docs[0].id
      userData = usersQuery.docs[0].data()
      
      // Update firebase_uid if missing
      if (uid && userData.firebase_uid !== uid) {
        await db.collection('users').doc(userDocId).update({ firebase_uid: uid })
      }
    } else if (uid) {
      usersQuery = await db.collection('users').where('firebase_uid', '==', uid).limit(1).get()
      if (!usersQuery.empty) {
        userDocId = usersQuery.docs[0].id
        userData = usersQuery.docs[0].data()
      }
    }

    let isNewUser = false
    const initialUsername = (given_name || name || email.split('@')[0] || 'User').trim()

    if (!userDocId) {
      isNewUser = true
      const newUserRef = db.collection('users').doc()
      userDocId = newUserRef.id
      userData = {
        email,
        username: '', // Empty initially to prompt onboarding
        firebase_uid: uid || null,
        created_at: new Date().toISOString(),
      }
      
      const batch = db.batch()
      batch.set(newUserRef, userData)
      
      // Create initial Inbox task list
      const taskListRef = db.collection('task_lists').doc()
      batch.set(taskListRef, {
        user_id: userDocId,
        name: 'Inbox',
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      await batch.commit()
    } else {
      isNewUser = !userData.username
    }

    const token = signToken(userDocId, userData.email)

    res.json({
      token,
      user: {
        id: userDocId,
        email: userData.email,
        username: userData.username,
        createdAt: userData.created_at || new Date().toISOString(),
      },
      isNewUser,
      suggestedUsername: userData.username || initialUsername,
    })
  })
)

router.put(
  '/onboard',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest
    const { username } = req.body

    if (typeof username !== 'string' || username.trim().length < 2) {
      res.status(400).json({ error: 'Username must be at least 2 characters long' })
      return
    }

    const cleanUsername = username.trim()

    await db.collection('users').doc(userId).update({
      username: cleanUsername
    })

    const updatedUser = await db.collection('users').doc(userId).get()

    res.json({
      user: {
        id: userId,
        email: updatedUser.data()!.email,
        username: cleanUsername,
        createdAt: updatedUser.data()!.created_at,
      },
    })
  })
)

export default router

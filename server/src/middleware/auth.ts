import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { adminAuth } from '../lib/firebase'

export interface JwtPayload {
  sub: string
  email: string
  username?: string
}

export interface AuthedRequest extends Request {
  userId: string
  userEmail: string
  userName: string
  firebaseUid?: string
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters')
  }
  return secret
}

export function signToken(userId: string, email: string, username: string = ''): string {
  return jwt.sign({ sub: userId, email, username }, getSecret(), { expiresIn: '7d' })
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authorization' })
    return
  }

  // 1. Attempt Firebase ID Token verification if Firebase Admin is configured
  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(token)
      if (decoded && decoded.uid) {
        const email = decoded.email ? decoded.email.toLowerCase().trim() : ''

        let usersSnap = await db.collection('users').where('firebase_uid', '==', decoded.uid).limit(1).get()
        if (usersSnap.empty && email) {
          usersSnap = await db.collection('users').where('email', '==', email).limit(1).get()
        }

        let userDocId: string | null = null
        let userData: any = null

        // Automatically provision user in Firestore if not found
        if (usersSnap.empty && email) {
          const username = (decoded.name || email.split('@')[0] || 'User').trim()
          
          const newUserRef = db.collection('users').doc()
          userDocId = newUserRef.id
          userData = {
            email,
            username,
            firebase_uid: decoded.uid,
            created_at: new Date().toISOString()
          }
          await newUserRef.set(userData)

          try {
            await db.collection('task_lists').doc().set({
              user_id: userDocId,
              name: 'Inbox',
              sort_order: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          } catch (err) {
            console.error('Failed to provision default TaskList:', err)
          }
        } else if (!usersSnap.empty) {
          userDocId = usersSnap.docs[0].id
          userData = usersSnap.docs[0].data()
          if (!userData.firebase_uid) {
            await db.collection('users').doc(userDocId).update({ firebase_uid: decoded.uid })
          }
        }

        if (userDocId && userData) {
          ;(req as AuthedRequest).userId = userDocId
          ;(req as AuthedRequest).userEmail = userData.email
          ;(req as AuthedRequest).userName = userData.username
          ;(req as AuthedRequest).firebaseUid = decoded.uid
          return next()
        }
      }
    } catch {
      // Not a valid Firebase ID token; fall through to custom JWT verification
    }
  }

  // 2. Fallback to custom JWT verification (for unit tests and legacy sessions)
  try {
    const decoded = jwt.verify(token, getSecret()) as JwtPayload
    if (!decoded.sub || !decoded.email) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }
    ;(req as AuthedRequest).userId = decoded.sub
    ;(req as AuthedRequest).userEmail = decoded.email
    ;(req as AuthedRequest).userName = decoded.username || ''
    return next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
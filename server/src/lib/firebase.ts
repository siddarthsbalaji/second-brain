import 'dotenv/config'
import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'

let initialized = false
let storageBucketName = process.env.FIREBASE_STORAGE_BUCKET || ''

function initFirebaseAdmin(): boolean {
  if (admin.apps.length > 0) {
    initialized = true
    return true
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (privateKey) {
    // Replace escaped \n characters with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  // 1. Check for explicit environment variables
  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: storageBucketName || `${projectId}.appspot.com`,
      })
      initialized = true
      return true
    } catch (err) {
      console.error('Failed to initialize Firebase Admin with environment credentials:', err)
    }
  }

  // 2. Check for serviceAccountKey.json in server root
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json')
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
      storageBucketName = storageBucketName || serviceAccount.project_id ? `${serviceAccount.project_id}.appspot.com` : ''
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucketName,
      })
      initialized = true
      return true
    } catch (err) {
      console.error('Failed to initialize Firebase Admin from serviceAccountKey.json:', err)
    }
  }

  // 3. Fallback to Google Application Default Credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: storageBucketName,
      })
      initialized = true
      return true
    } catch (err) {
      console.error('Failed to initialize Firebase Admin with application default credentials:', err)
    }
  }

  return false
}

export const isFirebaseAdminConfigured = initFirebaseAdmin()

export const adminAuth = isFirebaseAdminConfigured ? admin.auth() : null

export function getStorageBucket() {
  if (!isFirebaseAdminConfigured) return null
  try {
    return admin.storage().bucket(storageBucketName || undefined)
  } catch (err) {
    console.error('Failed to get Firebase Storage bucket:', err)
    return null
  }
}

export const firestoreDb = isFirebaseAdminConfigured ? admin.firestore() : null

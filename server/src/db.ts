import { firestoreDb } from './lib/firebase'
import { v4 as uuidv4 } from 'uuid'

export const db = firestoreDb!

export const generateId = () => uuidv4()

import { createContext } from 'react'

export type User = {
  id: string
  email: string
  username: string
  createdAt: string
  firebaseUid?: string
}

export type AuthState = {
  user: User | null
  token: string | null
  ready: boolean
  loginWithGoogle: (devData?: { email: string; name: string }) => Promise<{ isNewUser?: boolean; suggestedUsername?: string }>
  updateUsername: (newUsername: string) => Promise<void>
  login: (email: string, password?: string) => Promise<void>
  register: (email: string, password?: string) => Promise<void>
  logout: () => Promise<void> | void
}

export const AuthContext = createContext<AuthState | null>(null)
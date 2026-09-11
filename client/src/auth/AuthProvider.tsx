import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { api, attachAuthHeader, getStoredToken, setStoredToken } from '../lib/api'
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase'
import { AuthContext, type User } from './auth-context'
import { UsernamePromptModal } from '../components/auth/UsernamePromptModal'

type AuthResponse = {
  token?: string
  user: User
  isNewUser?: boolean
  suggestedUsername?: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [suggestedUsername, setSuggestedUsername] = useState('')

  useEffect(() => {
    const t = getStoredToken()
    attachAuthHeader(t)
    setToken(t)
  }, [])

  // Firebase auth state observer
  useEffect(() => {
    let cancelled = false

    if (!isFirebaseConfigured || !auth) {
      // Fallback if Firebase is not yet configured with env variables
      const existingToken = getStoredToken()
      if (existingToken) {
        attachAuthHeader(existingToken)
        api
          .get<{ user: User }>('/api/auth/me')
          .then(({ data }) => {
            if (!cancelled) {
              setUser(data.user)
              if (!data.user.username) {
                setSuggestedUsername(data.user.email.split('@')[0])
                setShowUsernameModal(true)
              }
            }
          })
          .catch(() => {
            setStoredToken(null)
            attachAuthHeader(null)
            if (!cancelled) {
              setToken(null)
              setUser(null)
            }
          })
          .finally(() => {
            if (!cancelled) setReady(true)
          })
      } else {
        setReady(true)
      }
      return () => {
        cancelled = true
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) return

      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken()
          setStoredToken(idToken)
          attachAuthHeader(idToken)
          setToken(idToken)

          // Sync with Express backend to ensure user exists in PostgreSQL
          const { data } = await api.post<AuthResponse>('/api/auth/sync')
          if (!cancelled) {
            setUser(data.user)
            if (data.isNewUser || !data.user.username) {
              setSuggestedUsername(data.suggestedUsername || data.user.email.split('@')[0])
              setShowUsernameModal(true)
            }
          }
        } catch (err) {
          console.error('Failed to sync Firebase session with server:', err)
          if (!cancelled) {
            // Keep local user details from Firebase if server sync fails temporarily
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              createdAt: new Date().toISOString(),
              firebaseUid: firebaseUser.uid,
            })
          }
        } finally {
          if (!cancelled) setReady(true)
        }
      } else {
        // Logged out
        setStoredToken(null)
        attachAuthHeader(null)
        setToken(null)
        setUser(null)
        setShowUsernameModal(false)
        setReady(true)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const loginWithGoogle = useCallback(
    async (devData?: { email: string; name: string }) => {
      if (devData) {
        // Dev bypass
        const { data } = await api.post<AuthResponse>('/api/auth/google', {
          devBypass: true,
          ...devData,
        })
        if (data.token) {
          setStoredToken(data.token)
          attachAuthHeader(data.token)
          setToken(data.token)
        }
        setUser(data.user)
        if (data.isNewUser || !data.user.username) {
          setSuggestedUsername(data.suggestedUsername || data.user.email.split('@')[0])
          setShowUsernameModal(true)
        }
        return { isNewUser: data.isNewUser, suggestedUsername: data.suggestedUsername }
      }

      if (!isFirebaseConfigured || !auth || !googleProvider) {
        throw new Error(
          'Firebase is not configured yet. Please add your VITE_FIREBASE_* credentials to client/.env'
        )
      }

      // Execute Firebase Google Sign-In popup
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      setStoredToken(idToken)
      attachAuthHeader(idToken)
      setToken(idToken)

      const { data } = await api.post<AuthResponse>('/api/auth/sync')
      setUser(data.user)

      if (data.isNewUser || !data.user.username) {
        setSuggestedUsername(data.suggestedUsername || data.user.email.split('@')[0])
        setShowUsernameModal(true)
      }

      return { isNewUser: data.isNewUser, suggestedUsername: data.suggestedUsername }
    },
    []
  )

  const updateUsername = useCallback(async (newUsername: string) => {
    const { data } = await api.patch<{ user: User }>('/api/auth/username', {
      username: newUsername,
    })
    setUser(data.user)
    setShowUsernameModal(false)
  }, [])

  const login = useCallback(async (email: string, password?: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', {
      email,
      password: password || 'default',
    })
    if (data.token) {
      setStoredToken(data.token)
      attachAuthHeader(data.token)
      setToken(data.token)
    }
    setUser(data.user)
    if (!data.user.username) {
      setSuggestedUsername(data.user.email.split('@')[0])
      setShowUsernameModal(true)
    }
  }, [])

  const register = useCallback(async (email: string, password?: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/register', {
      email,
      password: password || 'default',
    })
    if (data.token) {
      setStoredToken(data.token)
      attachAuthHeader(data.token)
      setToken(data.token)
    }
    setUser(data.user)
    setSuggestedUsername(data.user.username || data.user.email.split('@')[0])
    setShowUsernameModal(true)
  }, [])

  const logout = useCallback(async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth)
      }
    } finally {
      setStoredToken(null)
      attachAuthHeader(null)
      setToken(null)
      setUser(null)
      setShowUsernameModal(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      loginWithGoogle,
      updateUsername,
      login,
      register,
      logout,
    }),
    [user, token, ready, loginWithGoogle, updateUsername, login, register, logout]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      {user && showUsernameModal && (
        <UsernamePromptModal
          initialUsername={suggestedUsername}
          onSave={updateUsername}
        />
      )}
    </AuthContext.Provider>
  )
}
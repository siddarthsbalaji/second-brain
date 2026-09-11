import axios from 'axios'
import { auth, isFirebaseConfigured } from './firebase'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

const TOKEN_KEY = 'second-brain-token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function attachAuthHeader(token: string | null): void {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

// Automatically attach or refresh Firebase ID token on outgoing requests
api.interceptors.request.use(async (config) => {
  if (isFirebaseConfigured && auth && auth.currentUser) {
    try {
      const freshToken = await auth.currentUser.getIdToken()
      config.headers.Authorization = `Bearer ${freshToken}`
      setStoredToken(freshToken)
    } catch {
      const stored = getStoredToken()
      if (stored && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${stored}`
      }
    }
  } else {
    const stored = getStoredToken()
    if (stored && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${stored}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An unknown error occurred'
    return Promise.reject(new Error(message))
  }
)
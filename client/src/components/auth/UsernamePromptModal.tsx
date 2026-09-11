import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Sparkles, ArrowRight } from 'lucide-react'

interface Props {
  initialUsername: string
  onSave: (username: string) => Promise<void>
}

export function UsernamePromptModal({ initialUsername, onSave }: Props) {
  const [username, setUsername] = useState(initialUsername || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed) {
      setError('Please enter a display name or username')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSave(trimmed)
    } catch (err: any) {
      setError(err?.message || 'Failed to save username. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome to Second Brain
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize your workspace
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Choose a username or display name. It doesn't have to be unique since your account is tied to your email.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Your Display Name
            </label>
            <div className="relative mt-1.5 flex items-center">
              <span className="pointer-events-none absolute left-3.5 text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <input
                id="username-input"
                type="text"
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="e.g. Siddarth, Alex, Neo"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
              />
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400">{error}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <span>Continue to Second Brain</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

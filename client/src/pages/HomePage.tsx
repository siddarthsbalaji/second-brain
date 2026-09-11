import { Dashboard } from '../components/Dashboard'
import { useAuth } from '../auth/useAuth'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'

export function HomePage() {
  const { user } = useAuth()
  const displayName = user?.username || user?.email?.split('@')[0] || 'Explorer'

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center py-10 px-4">
      {/* Subtle radial background dot grid */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]" />

      <div className="mx-auto w-full max-w-[96%] 2xl:max-w-[1536px] space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, <span className="text-violet-600 dark:text-violet-400">{displayName}</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Here is what's happening across your Second Brain today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/lumen"
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50/70 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm transition-all hover:bg-violet-100 hover:shadow dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/50 active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />
              <span>Explore Lumen</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* Unified Dashboard Metrics */}
        <Dashboard />

        {/* Quick Access Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: 'easeOut' }}
          className="rounded-3xl border border-slate-200/80 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Lumen Knowledge & Inspiration Hub
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Discover curated philosophical wisdom, science facts, and trivia. Save insights directly to your notes.
              </p>
            </div>
          </div>
          <Link
            to="/lumen"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow transition-all hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white active:scale-95"
          >
            <span>Open Lumen</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
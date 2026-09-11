import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchCalendarRange } from '../lib/calendarApi'
import { fetchNotes } from '../lib/notesApi'
import { fetchTaskSummary } from '../lib/tasksApi'
import {
  CalendarDays,
  FileText,
  CheckSquare,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { motion } from 'framer-motion'

export function Dashboard() {
  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const nextWeek = new Date(now)
    nextWeek.setDate(now.getDate() + 7)
    return { rangeStart: now, rangeEnd: nextWeek }
  }, [])

  const { data: calendarData } = useQuery({
    queryKey: ['calendar-range', rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: () => fetchCalendarRange(rangeStart, rangeEnd),
  })

  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  })

  const { data: taskSummary } = useQuery({
    queryKey: ['tasks', 'summary'],
    queryFn: fetchTaskSummary,
  })

  const upcomingEvents = calendarData?.events ?? []
  const lastNote = notes[0]
  const totalOpen = taskSummary?.totalOpen ?? 0
  const priorityCounts = taskSummary?.byPriority ?? { high: 0, medium: 0, low: 0 }

  const cardVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' as const },
    }),
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* 1. Upcoming Events Card */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="group flex flex-col h-full rounded-3xl border border-slate-200/90 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-violet-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-violet-500/30"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-sm dark:border dark:border-violet-500/20 dark:bg-violet-950/40 dark:text-violet-300">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Upcoming Events
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Next 7 days ({upcomingEvents.length})
            </p>
          </div>
        </div>

        <div className="mt-6 flex-1 flex flex-col justify-between space-y-3">
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
              <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">No events scheduled this week.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingEvents.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition-colors hover:bg-slate-100 dark:border-slate-800/80 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                >
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {event.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(event.startsAt).toLocaleString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {upcomingEvents.length > 4 && (
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 text-center pt-1">
              +{upcomingEvents.length - 4} more event(s)
            </p>
          )}

          <Link
            to="/calendar"
            className="mt-auto pt-4 inline-flex items-center text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
          >
            <span>Open calendar</span>
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>

      {/* 2. Last Opened Note Card */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="group flex flex-col h-full rounded-3xl border border-slate-200/90 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-violet-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-violet-500/30"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-sm dark:border dark:border-violet-500/20 dark:bg-violet-950/40 dark:text-violet-300">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Recent Note
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Most recently modified</p>
          </div>
        </div>

        <div className="mt-6 flex-1 flex flex-col justify-between">
          {lastNote ? (
            <div className="flex-1 flex flex-col justify-between">
              <Link
                to={`/notes/${lastNote.id}`}
                className="block rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-all hover:border-violet-200 hover:bg-slate-100 dark:border-slate-800/80 dark:bg-slate-800/50 dark:hover:bg-slate-800"
              >
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {lastNote.title || 'Untitled Note'}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Updated {new Date(lastNote.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </Link>

              <Link
                to={`/notes/${lastNote.id}`}
                className="mt-auto pt-4 inline-flex items-center text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
              >
                <span>Continue writing</span>
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
              <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">No notes created yet.</p>
              <Link
                to="/notes/new"
                className="mt-4 inline-flex items-center text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
              >
                + Create your first note
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* 3. Tasks by Priority Card (Exact Database Counts) */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="group flex flex-col h-full rounded-3xl border border-slate-200/90 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-violet-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-violet-500/30"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-sm dark:border dark:border-violet-500/20 dark:bg-violet-950/40 dark:text-violet-300">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tasks by Priority
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {totalOpen} active task{totalOpen === 1 ? '' : 's'} across lists
            </p>
          </div>
        </div>

        <div className="mt-6 flex-1 flex flex-col justify-between space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            {/* High Priority */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 transition-colors dark:border-rose-900/30 dark:bg-rose-950/20">
              <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 mb-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">High</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {priorityCounts.high}
              </span>
            </div>

            {/* Medium Priority */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 transition-colors dark:border-amber-900/30 dark:bg-amber-950/20">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">Med</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {priorityCounts.medium}
              </span>
            </div>

            {/* Low Priority */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 transition-colors dark:border-blue-900/30 dark:bg-blue-950/20">
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">Low</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {priorityCounts.low}
              </span>
            </div>
          </div>

          <Link
            to="/tasks"
            className="mt-auto pt-4 inline-flex items-center text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
          >
            <span>Manage all tasks</span>
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
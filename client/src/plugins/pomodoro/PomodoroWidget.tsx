import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTasks, updateTask } from '../../lib/tasksApi'
import { useConfetti } from '../../hooks/useConfetti'
import type { Task } from '../../types/task'

type Mode = 'focus' | 'short_break' | 'long_break'

export function playPomodoroChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // Two harmonic bell chime tones (D5 and A5)
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc2.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    osc2.frequency.setValueAtTime(880, now) // A5

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 1.8)
    osc2.stop(now + 1.8)
  } catch (err) {
    console.warn('Pomodoro chime audio failed:', err)
  }
}

export function sendPomodoroNotification(title: string, body: string) {
  if (typeof window === 'undefined') return
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      })
    } catch (err) {
      console.warn('Native notification failed:', err)
    }
  }
}

export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
}

function getTodayDateString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getStoredTodayCount(): number {
  try {
    const today = getTodayDateString()
    const raw = localStorage.getItem('secondbrain_pomodoro_daily')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.date === today) {
        return typeof parsed.count === 'number' ? parsed.count : 0
      }
    }
  } catch {}
  return 0
}

function saveTodayCount(count: number) {
  try {
    const today = getTodayDateString()
    localStorage.setItem('secondbrain_pomodoro_daily', JSON.stringify({ date: today, count }))
  } catch {}
}

export function PomodoroWidget() {
  // Read stored settings or fallback defaults
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('secondbrain_plugin_pomodoro_settings')
      return raw
        ? JSON.parse(raw)
        : {
            workDuration: 25,
            shortBreak: 5,
            longBreak: 15,
            soundEnabled: true,
            autoStartBreak: false,
          }
    } catch {
      return {
        workDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        soundEnabled: true,
        autoStartBreak: false,
      }
    }
  })

  const [mode, setMode] = useState<Mode>('focus')
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60)
  const [isExpanded, setIsExpanded] = useState(false)
  const [todayCompletedCount, setTodayCompletedCount] = useState<number>(getStoredTodayCount)
  const [completedCount, setCompletedCount] = useState(() => {
    const saved = localStorage.getItem('secondbrain_pomodoro_count')
    return saved ? parseInt(saved, 10) || 0 : 0
  })
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(!settings.soundEnabled)

  const queryClient = useQueryClient()
  const confetti = useConfetti()

  // Fetch open tasks for linking
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'open', null, 1, 50],
    queryFn: () => fetchTasks('open', undefined, 1, 50),
    staleTime: 1000 * 30,
  })
  const openTasks = tasksData?.tasks || []
  const linkedTask = openTasks.find((t) => t.id === linkedTaskId) || null

  const completeTaskMut = useMutation({
    mutationFn: (id: string) => updateTask(id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-lists'] })
      setLinkedTaskId(null)
      confetti({ particleCount: 30 })
    },
  })

  // Get current duration for mode
  const getDurationForMode = (m: Mode) => {
    if (m === 'focus') return settings.workDuration * 60
    if (m === 'short_break') return settings.shortBreak * 60
    return settings.longBreak * 60
  }

  const totalDuration = getDurationForMode(mode)

  // Listen to setting changes in local storage
  useEffect(() => {
    const handleStorage = () => {
      try {
        const raw = localStorage.getItem('secondbrain_plugin_pomodoro_settings')
        if (raw) {
          const parsed = JSON.parse(raw)
          setSettings(parsed)
          setIsMuted(!parsed.soundEnabled)
        }
      } catch {}
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Timer tick
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Session completed!
            clearInterval(timerRef.current!)
            setIsRunning(false)

            if (!isMuted) {
              playPomodoroChime()
            }

            if (mode === 'focus') {
              const newCount = completedCount + 1
              setCompletedCount(newCount)
              localStorage.setItem('secondbrain_pomodoro_count', newCount.toString())

              const newToday = todayCompletedCount + 1
              setTodayCompletedCount(newToday)
              saveTodayCount(newToday)

              sendPomodoroNotification(
                'Pomodoro Completed! 🍅',
                `Awesome work! You have completed ${newToday} ${newToday === 1 ? 'pomodoro' : 'pomodoros'} today. Time for a break.`
              )

              confetti({ particleCount: 40 })

              // Auto switch to break or trigger break
              const nextMode: Mode = newCount % 4 === 0 ? 'long_break' : 'short_break'
              setMode(nextMode)
              const nextDuration = getDurationForMode(nextMode)
              setTimeLeft(nextDuration)
              if (settings.autoStartBreak) {
                setIsRunning(true)
              }
            } else {
              // Break finished, return to focus
              sendPomodoroNotification(
                'Break Finished! ⚡',
                'Ready to dive into your next focus session?'
              )
              setMode('focus')
              setTimeLeft(settings.workDuration * 60)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, mode, completedCount, todayCompletedCount, isMuted, settings])

  // Change mode manually
  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    setIsRunning(false)
    setTimeLeft(getDurationForMode(newMode))
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(getDurationForMode(mode))
  }

  const skipTimer = () => {
    setIsRunning(false)
    if (mode === 'focus') {
      const nextMode = (completedCount + 1) % 4 === 0 ? 'long_break' : 'short_break'
      setMode(nextMode)
      setTimeLeft(getDurationForMode(nextMode))
    } else {
      setMode('focus')
      setTimeLeft(settings.workDuration * 60)
    }
  }

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const progressFraction = Math.max(0, Math.min(1, 1 - timeLeft / totalDuration))
  const strokeDashoffset = 283 * (1 - progressFraction) // radius 45, 2 * pi * 45 ≈ 283

  return (
    <>
      {/* Floating Pill (Always visible in bottom right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {!isExpanded ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-3 rounded-full border border-violet-200 bg-white/95 px-4 py-2.5 shadow-lg shadow-violet-500/10 backdrop-blur-md transition-all hover:border-violet-400 hover:shadow-xl dark:border-violet-900/60 dark:bg-slate-900/95 dark:shadow-violet-950/40"
            >
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
                title="Expand Pomodoro Timer"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-base dark:bg-rose-950/60">
                  🍅
                </span>
                <span className="font-mono text-base tracking-tight text-violet-700 dark:text-violet-300">
                  {formattedTime}
                </span>
                {todayCompletedCount > 0 && (
                  <span
                    className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    title={`Pomodoros completed today: ${todayCompletedCount}`}
                  >
                    {todayCompletedCount} today
                  </span>
                )}
              </button>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

              <button
                type="button"
                onClick={() => {
                  if (!isRunning) requestNotificationPermission()
                  setIsRunning(!isRunning)
                }}
                className="rounded-full p-1.5 text-slate-600 transition hover:bg-violet-50 hover:text-violet-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-violet-400"
                title={isRunning ? 'Pause' : 'Start'}
              >
                {isRunning ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              </button>
            </motion.div>
          ) : (
            /* Expanded Timer Card */
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-80 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                  <span className="text-base">🍅</span>
                  <span>POMODORO FOCUS</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title={isMuted ? 'Unmute Chime' : 'Mute Chime'}
                  >
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title="Minimize"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Daily Pomodoro Counter Banner */}
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-rose-50/80 px-3 py-1.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                <div className="flex items-center gap-1.5 font-medium">
                  <span>🍅</span>
                  <span className="font-bold text-rose-900 dark:text-rose-100">{todayCompletedCount}</span>
                  <span>completed today</span>
                </div>
                {todayCompletedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTodayCompletedCount(0)
                      saveTodayCount(0)
                    }}
                    className="text-[10px] font-semibold text-rose-400 hover:text-rose-600 dark:hover:text-rose-200"
                    title="Reset today's count"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Mode Selector Tabs */}
              <div className="mt-3 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => switchMode('focus')}
                  className={`flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${
                    mode === 'focus'
                      ? 'bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Focus
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('short_break')}
                  className={`flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${
                    mode === 'short_break'
                      ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Short
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('long_break')}
                  className={`flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${
                    mode === 'long_break'
                      ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Long
                </button>
              </div>

              {/* Circular Timer Display */}
              <div className="relative my-5 flex items-center justify-center">
                <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-linear ${
                      mode === 'focus'
                        ? 'text-violet-600 dark:text-violet-400'
                        : mode === 'short_break'
                        ? 'text-emerald-500'
                        : 'text-blue-500'
                    }`}
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {formattedTime}
                  </span>
                  <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    {mode.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={resetTimer}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  title="Reset Timer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isRunning) requestNotificationPermission()
                    setIsRunning(!isRunning)
                  }}
                  className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md transition ${
                    isRunning
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
                      : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/20'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span>Start</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={skipTimer}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  title="Skip to next session"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

              {/* Task Linker Section */}
              <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Link Task</span>
                  {todayCompletedCount > 0 && (
                    <span>
                      🍅 {todayCompletedCount} {todayCompletedCount === 1 ? 'session' : 'sessions'} today
                    </span>
                  )}
                </div>

                <div className="mt-1.5">
                  <select
                    value={linkedTaskId || ''}
                    onChange={(e) => setLinkedTaskId(e.target.value || null)}
                    className="w-full truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">No task linked</option>
                    {openTasks.map((t: Task) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {linkedTask && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-violet-50 px-2.5 py-1.5 dark:bg-violet-950/40">
                    <span className="truncate text-xs font-medium text-violet-700 dark:text-violet-300">
                      🎯 {linkedTask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => completeTaskMut.mutate(linkedTask.id)}
                      disabled={completeTaskMut.isPending}
                      className="ml-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-violet-800 hover:bg-violet-100 dark:text-violet-200 dark:hover:bg-violet-900/60"
                      title="Mark task completed"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Done</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

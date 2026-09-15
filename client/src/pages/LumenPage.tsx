import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createNote } from '../lib/notesApi'
import {
  allLumenItems,
  type LumenItem,
} from '../data/lumenData'
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  BookmarkPlus,
  ExternalLink,
  HelpCircle,
} from 'lucide-react'

export function LumenPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null)
  const [isRotating, setIsRotating] = useState(false)

  const activeItem: LumenItem = allLumenItems[currentIndex % allLumenItems.length] || allLumenItems[0]

  const handleNext = useCallback(() => {
    setIsRotating(true)
    setShowAnswer(false)
    setSavedNoteId(null)
    setCopied(false)
    setTimeout(() => setIsRotating(false), 350)
    setCurrentIndex((prev) => (prev + 1) % allLumenItems.length)
  }, [])

  const handleCopy = async () => {
    let textToCopy = activeItem.content
    if (activeItem.type === 'trivia' && activeItem.answer) {
      textToCopy += `\n\nAnswer: ${activeItem.answer}`
    }
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveNoteMut = useMutation({
    mutationFn: async () => {
      let title = 'Lumen Insight'
      if (activeItem.type === 'line') {
        title = `Wisdom: ${activeItem.content.slice(0, 32)}...`
      } else if (activeItem.type === 'fact') {
        title = `Fact: ${activeItem.category}`
      } else if (activeItem.type === 'trivia') {
        title = `Trivia: ${activeItem.content.slice(0, 36)}...`
      }

      let content = `> ${activeItem.content}\n\n`
      if (activeItem.type === 'trivia' && activeItem.answer) {
        content += `**Answer**: ${activeItem.answer}\n\n`
      }
      content += `*Saved from Lumen Hub on ${new Date().toLocaleDateString()}*`

      return createNote({
        title,
        content,
      })
    },
    onSuccess: (newNote) => {
      setSavedNoteId(newNote.id)
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full py-10 px-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]" />

      <div className="mx-auto max-w-4xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-4 py-1.5 text-xs font-semibold text-violet-700 shadow-sm dark:border-violet-500/20 dark:bg-violet-950/40 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span>Lumen Knowledge & Curiosity Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Lumen: Sources For Inspiration
          </h1>
          <p className="max-w-xl text-sm text-slate-500 dark:text-slate-400">
            Things to think about
          </p>
        </div>

        {/* The Card Deck */}
        <div className="relative mx-auto max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -14 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 md:p-10"
            >
              {/* Top Card Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{activeItem.category}</span>
                </span>

                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {((currentIndex % allLumenItems.length) + 1)} / {allLumenItems.length}
                </span>
              </div>

              {/* Card Body */}
              <div className="my-8 min-h-[140px] flex flex-col justify-center">
                {activeItem.type === 'line' ? (
                  <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed italic text-slate-800 dark:text-slate-100 text-center">
                    {activeItem.content}
                  </blockquote>
                ) : activeItem.type === 'fact' ? (
                  <p className="text-lg sm:text-xl font-medium leading-relaxed text-slate-800 dark:text-slate-100">
                    {activeItem.content}
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                      {activeItem.content}
                    </p>

                    {showAnswer ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 text-sm font-medium"
                      >
                        <strong>Answer:</strong> {activeItem.answer}
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => setShowAnswer(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>Click to reveal answer</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    title="Copy text"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  {/* Save to Note Button */}
                  {savedNoteId ? (
                    <button
                      onClick={() => navigate(`/notes/${savedNoteId}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Open Note →</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => saveNoteMut.mutate()}
                      disabled={saveNoteMut.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                      title="Save to Second Brain notes"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5 text-violet-500" />
                      <span>{saveNoteMut.isPending ? 'Saving...' : 'Save to Note'}</span>
                    </button>
                  )}
                </div>

                {/* Next / Shuffle Button */}
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition-all hover:bg-violet-700 active:scale-95"
                >
                  <RefreshCw
                    className="h-4 w-4"
                    style={{
                      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: isRotating ? 'rotate(360deg)' : 'rotate(0deg)',
                    }}
                  />
                  <span>Next Insight</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import type { TaskPriority } from '../../types/task'
import { Plus, ChevronDown } from 'lucide-react'

export function NewTaskForm({
  onCreate,
  isPending,
}: {
  onCreate: (task: { title: string; description: string | null; dueAt: string | null; priority: TaskPriority }) => Promise<void>
  isPending: boolean
}) {
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDue, setNewDue] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('low')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    await onCreate({
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      dueAt: newDue ? new Date(newDue).toISOString() : null,
      priority: newPriority,
    })
    setNewTitle('')
    setNewDescription('')
    setNewDue('')
    setNewPriority('low')
  }

  return (
    <form onSubmit={handleCreate} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-500/10 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/80 dark:focus-within:border-violet-500/50">
      <div className="flex gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-300">
          <Plus className="h-5 w-5" />
        </div>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Task name"
          className="h-10 w-full bg-transparent pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || isPending}
          className="shrink-0 rounded-xl bg-violet-600 px-6 font-semibold text-white transition-opacity hover:bg-violet-700 disabled:opacity-0"
        >
          Add
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-12 pr-4 pb-1">
        <input
          type="datetime-local"
          value={newDue}
          onChange={(e) => setNewDue(e.target.value)}
          className="cursor-pointer appearance-none rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-100 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:border-violet-500/50"
        />
        <div className="relative inline-flex items-center">
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
            className="cursor-pointer appearance-none rounded-xl border border-slate-200/80 bg-slate-50 py-2 pl-3 pr-7 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-100 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:border-violet-500/50"
          >
            <option value="low" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Low Priority</option>
            <option value="medium" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Medium Priority</option>
            <option value="high" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">High Priority</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
        </div>
        <input
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description (optional)"
          className="min-w-[150px] flex-1 rounded-xl border border-transparent bg-slate-50/50 px-3 py-2 text-xs text-slate-600 transition-all hover:bg-slate-100 focus:border-violet-500 focus:bg-slate-50 focus:outline-none dark:bg-slate-800/30 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:focus:bg-slate-800"
        />
      </div>
    </form>
  )
}

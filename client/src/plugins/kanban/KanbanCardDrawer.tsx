import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  CheckSquare,
  Plus,
  Trash2,
} from 'lucide-react'
import type { Task, SubTask, TaskPriority, TaskStatus } from '../../types/task'

interface KanbanCardDrawerProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, patch: Partial<Task>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function KanbanCardDrawer({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: KanbanCardDrawerProps) {
  if (!task || !isOpen) return null

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [dueAt, setDueAt] = useState(
    task.dueAt ? task.dueAt.slice(0, 16) : ''
  )
  const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks || [])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return
    const newSub: SubTask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false,
    }
    setSubtasks([...subtasks, newSub])
    setNewSubtaskTitle('')
  }

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    )
  }

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id))
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        subtasks,
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) return
    setIsDeleting(true)
    try {
      await onDelete(task.id)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  const completedCount = subtasks.filter((s) => s.completed).length

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Kanban Card
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Card Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base font-semibold text-slate-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Column / Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="open">📌 To Do</option>
                  <option value="in_progress">⚡ In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Description & Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add card details, requirements, or links..."
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Subtasks / Checklist Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CheckSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span>Card Tasks & Subtasks</span>
                </div>
                {subtasks.length > 0 && (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {completedCount} of {subtasks.length} completed
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {subtasks.length > 0 && (
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-violet-600 transition-all duration-300 dark:bg-violet-400"
                    style={{
                      width: `${(completedCount / subtasks.length) * 100}%`,
                    }}
                  />
                </div>
              )}

              {/* Subtask list */}
              <div className="mt-3 space-y-2">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm transition dark:border-slate-700 dark:bg-slate-900"
                  >
                    <label className="flex flex-1 items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-800"
                      />
                      <span
                        className={`font-medium ${
                          sub.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {sub.title}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                      title="Delete subtask"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Subtask Input Form */}
              <form onSubmit={handleAddSubtask} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a new checklist task and press Enter..."
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
            <button
              type="button"
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Card</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving || !title.trim()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:bg-violet-500 disabled:opacity-50 transition"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

import React from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
} from 'lucide-react'
import type { Task, SubTask } from '../../types/task'

interface KanbanCardProps {
  task: Task
  onEdit: (task: Task) => void
  onUpdateSubtasks: (taskId: string, subtasks: SubTask[]) => void
  onMoveStatus: (taskId: string, newStatus: Task['status']) => void
  onDragStart: (e: React.DragEvent, taskId: string) => void
}

const priorityColors: Record<string, { bg: string; text: string; dot: string }> = {
  high: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
}

export function KanbanCard({
  task,
  onEdit,
  onUpdateSubtasks,
  onMoveStatus,
  onDragStart,
}: KanbanCardProps) {
  const subtasks = task.subtasks || []
  const completedSubtasks = subtasks.filter((s) => s.completed).length
  const totalSubtasks = subtasks.length

  const pConfig = priorityColors[task.priority] || priorityColors.low

  const isOverdue =
    task.dueAt &&
    task.status !== 'completed' &&
    new Date(task.dueAt).getTime() < Date.now()

  const formattedDueDate = task.dueAt
    ? new Date(task.dueAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null

  const handleToggleSubtask = (e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation()
    const updated = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    )
    onUpdateSubtasks(task.id, updated)
  }

  return (
    <motion.div
      layoutId={task.id}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task.id)}
      onClick={() => onEdit(task)}
      className="group relative cursor-grab active:cursor-grabbing rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-violet-800/70"
    >
      {/* Card Header: Priority badge & Quick Move Buttons */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${pConfig.bg} ${pConfig.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${pConfig.dot}`} />
          {task.priority}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {task.status === 'in_progress' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onMoveStatus(task.id, 'open')
              }}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Move back to To Do"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          )}

          {task.status === 'open' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onMoveStatus(task.id, 'in_progress')
              }}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Move to In Progress"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          {task.status !== 'completed' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onMoveStatus(task.id, 'completed')
              }}
              className="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
              title="Mark as Completed"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          )}

          {task.status === 'completed' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onMoveStatus(task.id, 'open')
              }}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Re-open card"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Card Title */}
      <h4
        className={`mt-2 text-sm font-semibold leading-snug tracking-tight text-slate-800 dark:text-slate-100 ${
          task.status === 'completed' ? 'line-through opacity-70' : ''
        }`}
      >
        {task.title}
      </h4>

      {/* Optional Description snippet */}
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
          {task.description}
        </p>
      )}

      {/* Subtasks Checklist preview */}
      {totalSubtasks > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800/60">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              <span>Subtasks</span>
            </span>
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-violet-600 transition-all duration-300 dark:bg-violet-500"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>

          {/* Up to 3 subtasks quick view */}
          <div className="space-y-1 pt-1">
            {subtasks.slice(0, 3).map((sub) => (
              <div
                key={sub.id}
                onClick={(e) => handleToggleSubtask(e, sub.id)}
                className="flex items-center gap-2 rounded px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
              >
                <input
                  type="checkbox"
                  checked={sub.completed}
                  onChange={() => {}}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800"
                />
                <span
                  className={`truncate ${
                    sub.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                  }`}
                >
                  {sub.title}
                </span>
              </div>
            ))}
            {totalSubtasks > 3 && (
              <span className="block px-1.5 text-[10px] text-slate-400">
                +{totalSubtasks - 3} more subtasks
              </span>
            )}
          </div>
        </div>
      )}

      {/* Card Footer: Due Date & Metadata */}
      {formattedDueDate && (
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2 text-xs dark:border-slate-800/60">
          <div
            className={`inline-flex items-center gap-1 font-medium ${
              isOverdue
                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
            <span>{formattedDueDate}</span>
            {isOverdue && <span className="text-[10px] uppercase tracking-wider">(Overdue)</span>}
          </div>
        </div>
      )}
    </motion.div>
  )
}

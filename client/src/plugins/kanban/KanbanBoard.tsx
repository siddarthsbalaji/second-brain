import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ListTodo, Zap, CheckCircle2 } from 'lucide-react'
import { KanbanCard } from './KanbanCard'
import { KanbanCardDrawer } from './KanbanCardDrawer'
import { useConfetti } from '../../hooks/useConfetti'
import type { Task, SubTask, TaskStatus } from '../../types/task'

interface KanbanBoardProps {
  listId: string
  tasks: Task[]
  isLoading: boolean
  onUpdateTask: (id: string, patch: Partial<Task>) => Promise<void>
  onCreateTask: (task: { title: string; listId: string; status?: TaskStatus }) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
}

interface ColumnConfig {
  id: TaskStatus
  title: string
  icon: React.ComponentType<{ className?: string }>
  badgeColor: string
  dropBg: string
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'open',
    title: 'To Do',
    icon: ListTodo,
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    dropBg: 'border-violet-300 bg-violet-50/20 dark:border-violet-700 dark:bg-violet-950/20',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: Zap,
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    dropBg: 'border-amber-300 bg-amber-50/20 dark:border-amber-700 dark:bg-amber-950/20',
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: CheckCircle2,
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    dropBg: 'border-emerald-300 bg-emerald-50/20 dark:border-emerald-700 dark:bg-emerald-950/20',
  },
]

export function KanbanBoard({
  listId,
  tasks,
  isLoading,
  onUpdateTask,
  onCreateTask,
  onDeleteTask,
}: KanbanBoardProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null)
  const [addingCol, setAddingCol] = useState<TaskStatus | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const confetti = useConfetti()

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCol !== colId) {
      setDragOverCol(colId)
    }
  }

  const handleDragLeave = () => {
    setDragOverCol(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    setDragOverCol(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === targetStatus) return

    try {
      await onUpdateTask(taskId, { status: targetStatus })
      if (targetStatus === 'completed') {
        confetti({ particleCount: 35 })
      }
    } catch (err) {
      console.error('Failed to move task status:', err)
    }
  }

  const handleMoveStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await onUpdateTask(taskId, { status: newStatus })
      if (newStatus === 'completed') {
        confetti({ particleCount: 35 })
      }
    } catch (err) {
      console.error('Failed to move task status:', err)
    }
  }

  const handleUpdateSubtasks = async (taskId: string, subtasks: SubTask[]) => {
    try {
      await onUpdateTask(taskId, { subtasks })
    } catch (err) {
      console.error('Failed to update subtasks:', err)
    }
  }

  const handleQuickAdd = async (colId: TaskStatus) => {
    if (!newCardTitle.trim()) return
    try {
      await onCreateTask({
        title: newCardTitle.trim(),
        listId,
        status: colId,
      })
      setNewCardTitle('')
      setAddingCol(null)
    } catch (err) {
      console.error('Failed to create card:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-96 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/70 p-4 dark:border-slate-800 dark:bg-slate-900/50"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Board Columns */}
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id)
          const isOver = dragOverCol === col.id
          const Icon = col.icon

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border border-slate-200/90 bg-slate-100/60 p-4 transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900/40 min-h-[500px] ${
                isOver ? col.dropBg + ' ring-2 ring-violet-500/30' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {col.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${col.badgeColor}`}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAddingCol(addingCol === col.id ? null : col.id)
                    setNewCardTitle('')
                  }}
                  className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition"
                  title="Add card to column"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Add Card Form */}
              {addingCol === col.id && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 rounded-xl border border-violet-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <input
                    type="text"
                    autoFocus
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd(col.id)
                      if (e.key === 'Escape') setAddingCol(null)
                    }}
                    placeholder="Enter card title..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:border-violet-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <div className="mt-2 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAddingCol(null)}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(col.id)}
                      disabled={!newCardTitle.trim()}
                      className="rounded-md bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition"
                    >
                      Add Card
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 p-4 text-center dark:border-slate-800/80">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      No cards in this column
                    </p>
                    <button
                      type="button"
                      onClick={() => setAddingCol(col.id)}
                      className="mt-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
                    >
                      + Create a card
                    </button>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      onEdit={setEditingTask}
                      onUpdateSubtasks={handleUpdateSubtasks}
                      onMoveStatus={handleMoveStatus}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Card Detail Drawer Modal */}
      {editingTask && (
        <KanbanCardDrawer
          task={editingTask}
          isOpen={Boolean(editingTask)}
          onClose={() => setEditingTask(null)}
          onSave={onUpdateTask}
          onDelete={onDeleteTask}
        />
      )}
    </div>
  )
}

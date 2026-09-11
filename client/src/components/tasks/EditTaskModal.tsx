import React, { useState } from'react'
import type { Task, TaskPriority, SubTask } from'../../types/task'
import { Trash2, ChevronDown, CheckSquare, Plus } from 'lucide-react'
const inputCls =
'w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-500/50'
function toDatetimeLocalValue(iso:string | null):string {
  if (!iso) return''
  const d=new Date(iso)
  const pad=(n: number)=>String(n).padStart(2,'0')
  return`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export function EditTaskModal({
  task,
  onCancel,
  onSave,
  onDelete,
  isPending,
}: {
  task: Task
  onCancel: ()=>void
  onSave: (patch: Partial<Task>)=>Promise<void>
  onDelete?: ()=>void
  isPending: boolean
}) {
  const [title, setTitle]=useState(task.title)
  const [description, setDescription]=useState(task.description ??'')
  const [due, setDue]=useState(toDatetimeLocalValue(task.dueAt))
  const [priority, setPriority]=useState<TaskPriority>(task.priority)
  const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks || [])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await onSave({
      title: title.trim(),
      description: description.trim()||null,
      dueAt: due ? new Date(due).toISOString() : null,
      priority,
      subtasks,
    })
  }

  const completedCount = subtasks.filter((s) => s.completed).length
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm transition-all sm:items-center dark:bg-slate-950/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 md:p-8 shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-950">
        <h2 id="edit-task-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Edit Task
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Title
            </label>
            <input
              id="edit-title"
              value={title}
              onChange={(e)=>setTitle(e.target.value)}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <div>
            <label htmlFor="edit-due" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Due Date
            </label>
            <input
              id="edit-due"
              type="datetime-local"
              value={due}
              onChange={(e)=>setDue(e.target.value)}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <div>
            <label htmlFor="edit-priority" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Priority
            </label>
            <div className="relative mt-1.5 flex items-center">
              <select
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={`cursor-pointer appearance-none pr-8 ${inputCls}`}
              >
                <option value="low" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Low Priority</option>
                <option value="medium" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Medium Priority</option>
                <option value="high" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">High Priority</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div>
            <label htmlFor="edit-desc" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              id="edit-desc"
              value={description}
              onChange={(e)=>setDescription(e.target.value)}
              rows={4}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <CheckSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span>Subtasks</span>
              </div>
              {subtasks.length > 0 && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {completedCount} of {subtasks.length} completed
                </span>
              )}
            </div>

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

            <div className="mt-3 space-y-2">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition dark:border-slate-700 dark:bg-slate-900"
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
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSubtask(e)
                  }
                }}
                placeholder="Add new subtask..."
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-xl flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors dark:text-rose-400 dark:hover:bg-rose-900/20"
              >
                <Trash2 className="w-4 h-4" />Delete
              </button>
            ) :<div/>}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending||!title.trim()}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isPending ?'Saving…' :'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

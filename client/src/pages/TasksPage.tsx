import { useMutation, useQuery, useQueryClient } from'@tanstack/react-query'
import { useEffect, useState } from'react'
import { LayoutList, LayoutGrid } from'lucide-react'

import { fetchTaskLists, fetchTasks, createTask, updateTask, deleteTask, updateTaskList } from'../lib/tasksApi'
import { useConfetti } from'../hooks/useConfetti'
import type { Task, TaskFilter } from'../types/task'
import { TaskSidebar } from'../components/tasks/TaskSidebar'
import { TaskList } from'../components/tasks/TaskList'
import { NewTaskForm } from'../components/tasks/NewTaskForm'
import { EditTaskModal } from'../components/tasks/EditTaskModal'
import { usePlugins } from'../context/PluginContext'
import { KanbanBoard } from'../plugins/kanban/KanbanBoard'

export function TasksPage() {
  const queryClient=useQueryClient()
  const { isPluginEnabled } = usePlugins()
  const isKanbanActive = isPluginEnabled('kanban')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => {
    try {
      return (localStorage.getItem('secondbrain_tasks_view') as any) || 'kanban'
    } catch {
      return 'kanban'
    }
  })
  const [filter, setFilter]=useState<TaskFilter>('open')
  const [editing, setEditing]=useState<Task | null>(null)
  const [selectedListId, setSelectedListId]=useState<string | null>(null)
  const [renameListName, setRenameListName]=useState('')
  const [page, setPage]=useState(1)
  const limit = (isKanbanActive && viewMode === 'kanban') ? 100 : 50
  const { data: lists=[] }=useQuery({
    queryKey: ['task-lists'],
    queryFn: fetchTaskLists,
  })
  useEffect(()=>{
    if (!selectedListId&&lists.length>0) {
      setSelectedListId(lists[0].id)
    }
    if (selectedListId&&!lists.some((list)=>list.id===selectedListId)) {
      setSelectedListId(lists[0]?.id ?? null)
    }
  }, [lists, selectedListId])
  useEffect(()=>{
    const selected=lists.find((list)=>list.id===selectedListId)
    if (selected) {
      setRenameListName(selected.name)
    }
  }, [lists, selectedListId])
  useEffect(()=>{
    setPage(1)
  }, [filter, selectedListId, viewMode])
  const selectedList=lists.find((list)=>list.id===selectedListId) ?? null
  const queryFilter: TaskFilter = (isKanbanActive && viewMode === 'kanban') ? 'all' : filter
  const { data: tasksData, isLoading, error }=useQuery({
    queryKey: ['tasks', queryFilter, selectedListId, page, limit],
    queryFn: ()=>(selectedListId ? fetchTasks(queryFilter, selectedListId, page, limit) : Promise.resolve({tasks: [], total: 0})),
    enabled: Boolean(selectedListId),
  })
  const tasks=tasksData?.tasks ?? []
  const total=tasksData?.total ? tasksData.total : tasks.length
  const invalidate=()=>{
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['task-lists'] })
    queryClient.invalidateQueries({ queryKey: ['calendar'] })
  }
  const createMut=useMutation({
    mutationFn: (body: Parameters<typeof createTask>[0])=>createTask(body),
    onSuccess: ()=>invalidate(),
  })
  const renameListMut=useMutation({
    mutationFn: ({ id, name }: { id:string; name:string })=>updateTaskList(id, { name }),
    onSuccess: ()=>invalidate(),
  })
  const confetti=useConfetti()
  const updateMut=useMutation({
    mutationFn: ({ id, patch }: { id:string; patch: Parameters<typeof updateTask>[1] })=>updateTask(id, patch),
    onSuccess: ()=>{
      setEditing(null)
      invalidate()
    },
  })
  const deleteMut=useMutation({
    mutationFn: deleteTask,
    onSuccess: ()=>{
      setEditing(null)
      invalidate()
    },
  })
  async function handleToggleTaskStatus(task: Task) {
    const nextStatus=task.status==='completed' ?'open' :'completed'
    try {
      await updateMut.mutateAsync({ id: task.id, patch: { status: nextStatus } })
      if (nextStatus==='completed') {
        await confetti({ particleCount: 32, duration: 1200 })
      }
    } catch {}
  }
  const errMsg = error ? (error as Error).message : null
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[96%] 2xl:max-w-[1536px] flex-col justify-center py-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <TaskSidebar
          filter={filter}
          setFilter={setFilter}
          lists={lists}
          selectedListId={selectedListId}
          setSelectedListId={setSelectedListId}
          errMsg={errMsg||null}
        />
        <div className="min-w-0 flex-1 space-y-6">
          {selectedList&&(
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 dark:border-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input
                  value={renameListName}
                  onChange={(e)=>setRenameListName(e.target.value)}
                  onBlur={()=>renameListMut.mutate({ id: selectedList.id, name: renameListName.trim() })}
                  onKeyDown={(e)=>{
                    if (e.key==='Enter') e.currentTarget.blur()
                  }}
                  className="w-full max-w-sm rounded-lg border-transparent bg-transparent px-1 py-1 text-2xl font-semibold tracking-tight text-slate-900 hover:bg-slate-50 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:text-slate-100 dark:hover:bg-slate-800/50 dark:focus:bg-slate-800"
                />
                <span className="shrink-0 px-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {total} {total===1 ?'task' :'tasks'}
                </span>
              </div>

              {isKanbanActive && (
                <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('list')
                      localStorage.setItem('secondbrain_tasks_view', 'list')
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      viewMode === 'list'
                        ? 'bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                    }`}
                    title="List View"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    <span>List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('kanban')
                      localStorage.setItem('secondbrain_tasks_view', 'kanban')
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      viewMode === 'kanban'
                        ? 'bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                    }`}
                    title="Kanban Board View"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Kanban</span>
                  </button>
                </div>
              )}
            </div>
          )}
          {isKanbanActive && viewMode === 'kanban' ? (
            selectedList && (
              <KanbanBoard
                listId={selectedList.id}
                tasks={tasks}
                isLoading={isLoading}
                onUpdateTask={async (id, patch) => {
                  await updateMut.mutateAsync({ id, patch: patch as any })
                }}
                onCreateTask={async (t) => {
                  await createMut.mutateAsync(t as any)
                }}
                onDeleteTask={async (id) => {
                  await deleteMut.mutateAsync(id)
                }}
              />
            )
          ) : (
            <>
              {selectedList&&(
                <NewTaskForm
                  onCreate={async (t)=>{ await createMut.mutateAsync({ ...t, listId: selectedList.id }) }}
                  isPending={createMut.isPending}
                />
              )}
              <TaskList
                tasks={tasks}
                isLoading={isLoading}
                onToggleStatus={handleToggleTaskStatus}
                onEdit={setEditing}
                onDelete={(id)=>deleteMut.mutate(id)}
                page={page}
                setPage={setPage}
                total={total}
                limit={limit}
              />
            </>
          )}
        </div>
      </div>
      {editing&&(
        <EditTaskModal
          task={editing}
          onCancel={()=>setEditing(null)}
          onSave={async (patch)=>{ await updateMut.mutateAsync({ id: editing.id, patch: patch as any }) }}
          isPending={updateMut.isPending}
        />
      )}
    </div>
  )
}
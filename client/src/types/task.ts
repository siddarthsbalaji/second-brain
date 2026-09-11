export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'open' | 'in_progress' | 'completed'

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export type TaskList = {
  id: string
  userId: string
  name: string
  sortOrder: number
}

export type Task = {
  id: string
  title: string
  description: string | null
  dueAt: string | null
  priority: TaskPriority
  status: TaskStatus
  completedAt: string | null
  sortOrder: number
  listId: string | null
  subtasks?: SubTask[]
  createdAt: string
  updatedAt: string
}

export type TaskFilter = 'all' | 'open' | 'in_progress' | 'completed'
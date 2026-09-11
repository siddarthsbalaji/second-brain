export function taskRowToJson(docId: string, row: any) {
  return {
    id: docId,
    title: row.title || '',
    description: row.description || null,
    dueAt: row.due_at || null,
    priority: row.priority || 'low',
    status: row.status || 'open',
    completedAt: row.completed_at || null,
    sortOrder: row.sort_order || 0,
    listId: row.task_list_id || null,
    subtasks: row.subtasks || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

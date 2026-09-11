export function folderRowToJson(row: any) { return { id: row.id, name: row.name, parentId: row.parent_id, createdAt: row.created_at, updatedAt: row.updated_at } }

// Tag entity type
export interface Tag {
  id: string // UUID
  user_id: string // UUID
  name: string
  color: string // Hex color code (e.g., #FF5733)
  created_at: string // ISO 8601 datetime
  task_count: number // Number of tasks using this tag
}

// Tag operation types
export interface CreateTagRequest {
  name: string
  color?: string // Defaults to #6B7280 if not provided
}

export interface UpdateTagRequest {
  name?: string
  color?: string
}

// Tag list response
export type TagListResponse = Tag[]

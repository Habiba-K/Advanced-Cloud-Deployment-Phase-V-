// Tag summary type (embedded in Task)
export interface TagSummary {
  id: string // UUID
  name: string
  color: string // Hex color code
}

// Task priority type
export type TaskPriority = 'low' | 'medium' | 'high'

// Task entity type
export interface Task {
  id: string // UUID
  user_id: string // UUID
  title: string
  description: string | null
  completed: boolean
  priority: TaskPriority
  tags: TagSummary[]
  due_date: string | null // ISO date string (YYYY-MM-DD)
  remind_at: string | null // ISO datetime string
  completed_at: string | null // ISO datetime string
  created_at: string // ISO 8601 datetime
  updated_at: string // ISO 8601 datetime
}

// Task operation types
export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: TaskPriority
  tag_ids?: string[] // Array of tag UUIDs
  due_date?: string // ISO date string (YYYY-MM-DD)
  remind_at?: string // ISO datetime string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  completed?: boolean
  priority?: TaskPriority
  tag_ids?: string[] // Array of tag UUIDs
  due_date?: string // ISO date string (YYYY-MM-DD)
  remind_at?: string // ISO datetime string
}

// Task list response
export type TaskListResponse = Task[]

// UI state types
export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ErrorState {
  hasError: boolean
  message: string
  code?: string // 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'SERVER_ERROR'
}

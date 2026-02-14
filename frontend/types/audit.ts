export interface AuditLogEntry {
  id: string
  user_id: string
  event_type: 'created' | 'updated' | 'completed' | 'deleted'
  task_id: string
  task_data: Record<string, any>
  event_id: string
  timestamp: string
}

export interface AuditLogListResponse {
  items: AuditLogEntry[]
  total: number
  offset: number
  limit: number
}

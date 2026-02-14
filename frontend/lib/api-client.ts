import { getSession } from './auth'
import { redirect } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const session = await getSession()
  const token = session?.session?.token

  if (!token) {
    redirect('/signin')
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers
    }
  })

  // Handle 401 Unauthorized - redirect to signin
  if (response.status === 401) {
    redirect('/signin')
  }

  // Handle 403 Forbidden
  if (response.status === 403) {
    throw new Error('Access forbidden')
  }

  // Handle other errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'API request failed')
  }

  return response.json()
}

// Helper methods for different HTTP verbs
export const api = {
  get: <T>(endpoint: string) => apiClient<T>(endpoint),

  post: <T>(endpoint: string, data: any) =>
    apiClient<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  put: <T>(endpoint: string, data: any) =>
    apiClient<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: <T>(endpoint: string) =>
    apiClient<T>(endpoint, { method: 'DELETE' }),

  patch: <T>(endpoint: string, data?: any) =>
    apiClient<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
}

// Tag API methods
import type { Tag, CreateTagRequest, UpdateTagRequest, AuditLogListResponse } from '@/types'

export const tagApi = {
  // List all tags for a user
  listTags: (userId: string) =>
    api.get<Tag[]>(`/api/${userId}/tags`),

  // Create a new tag
  createTag: (userId: string, data: CreateTagRequest) =>
    api.post<Tag>(`/api/${userId}/tags`, data),

  // Update an existing tag
  updateTag: (userId: string, tagId: string, data: UpdateTagRequest) =>
    api.put<Tag>(`/api/${userId}/tags/${tagId}`, data),

  // Delete a tag
  deleteTag: (userId: string, tagId: string) =>
    api.delete<{ message: string }>(`/api/${userId}/tags/${tagId}`)
}

// Audit API methods
export const auditApi = {
  listAuditLogs: (userId: string, params?: {
    limit?: number
    offset?: number
    event_type?: string
    task_id?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset !== undefined) searchParams.set('offset', String(params.offset))
    if (params?.event_type) searchParams.set('event_type', params.event_type)
    if (params?.task_id) searchParams.set('task_id', params.task_id)
    const qs = searchParams.toString()
    return api.get<AuditLogListResponse>(`/api/${userId}/audit${qs ? `?${qs}` : ''}`)
  }
}

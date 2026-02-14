'use client'

import { useState } from 'react'
import type { AuditLogEntry } from '@/types'

const eventStyles: Record<string, { bg: string; text: string; label: string }> = {
  created: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', label: 'Created' },
  updated: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', label: 'Updated' },
  completed: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-400', label: 'Completed' },
  deleted: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', label: 'Deleted' },
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AuditEntry({ entry }: { entry: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const style = eventStyles[entry.event_type] || eventStyles.updated

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start gap-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
          {style.label}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {entry.task_data?.title || `Task ${entry.task_id.slice(0, 8)}...`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatTimestamp(entry.timestamp)}
          </p>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title={expanded ? 'Collapse' : 'Expand details'}
        >
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Task Snapshot</p>
          <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
            {entry.task_data?.title && <div><span className="text-gray-500">Title:</span> {entry.task_data.title}</div>}
            {entry.task_data?.description && <div><span className="text-gray-500">Description:</span> {entry.task_data.description}</div>}
            {entry.task_data?.priority && <div><span className="text-gray-500">Priority:</span> {entry.task_data.priority}</div>}
            {entry.task_data?.status && <div><span className="text-gray-500">Status:</span> {entry.task_data.status}</div>}
            {entry.task_data?.due_date && <div><span className="text-gray-500">Due:</span> {entry.task_data.due_date}</div>}
            {entry.task_data?.recurrence_pattern && entry.task_data.recurrence_pattern !== 'none' && (
              <div><span className="text-gray-500">Recurrence:</span> {entry.task_data.recurrence_pattern} (every {entry.task_data.recurrence_interval || 1})</div>
            )}
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
            Event ID: {entry.event_id}
          </p>
        </div>
      )}
    </div>
  )
}

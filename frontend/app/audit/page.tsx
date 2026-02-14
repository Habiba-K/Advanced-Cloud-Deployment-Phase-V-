'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { auditApi } from '@/lib/api-client'
import AuditEntry from '@/components/AuditEntry'
import { Button } from '@/components/ui/Button'
import type { AuditLogEntry } from '@/types'

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'completed', label: 'Completed' },
  { value: 'deleted', label: 'Deleted' },
]

const PAGE_SIZE = 20

export default function AuditPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [eventFilter, setEventFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession()
      if (!session?.user?.id) {
        router.push('/signin')
        return
      }
      setUserId(session.user.id)
    }
    checkAuth()
  }, [router])

  const fetchAuditLogs = useCallback(async (newOffset = 0, append = false) => {
    if (!userId) return
    setLoading(true)
    setError(null)

    try {
      const result = await auditApi.listAuditLogs(userId, {
        limit: PAGE_SIZE,
        offset: newOffset,
        event_type: eventFilter || undefined,
      })
      setEntries(append ? (prev) => [...prev, ...result.items] : result.items)
      setTotal(result.total)
      setOffset(newOffset)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [userId, eventFilter])

  useEffect(() => {
    if (userId) fetchAuditLogs(0)
  }, [userId, eventFilter, fetchAuditLogs])

  const hasMore = offset + PAGE_SIZE < total

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track all changes to your tasks
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</label>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {EVENT_TYPES.map((et) => (
            <option key={et.value} value={et.value}>{et.label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {total} event{total !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button variant="secondary" onClick={() => fetchAuditLogs(0)}>
            Retry
          </Button>
        </div>
      )}

      {/* Entries */}
      {!loading && entries.length === 0 && !error && (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No activity yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Task events will appear here as you create and manage tasks</p>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <AuditEntry key={entry.id} entry={entry} />
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && entries.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="secondary"
            onClick={() => fetchAuditLogs(offset + PAGE_SIZE, true)}
            loading={loading}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import type { Tag, TaskPriority } from '@/types'
import { tagApi } from '@/lib/api-client'
import { getSession } from '@/lib/auth'

interface FilterPanelProps {
  status: string | null
  priority: string | null
  tagIds: string[]
  dueDateFrom: string | null
  dueDateTo: string | null
  onStatusChange: (status: string | null) => void
  onPriorityChange: (priority: string | null) => void
  onTagIdsChange: (tagIds: string[]) => void
  onDueDateFromChange: (date: string | null) => void
  onDueDateToChange: (date: string | null) => void
  onClearAll: () => void
  className?: string
  alwaysExpanded?: boolean
}

export default function FilterPanel({
  status,
  priority,
  tagIds,
  dueDateFrom,
  dueDateTo,
  onStatusChange,
  onPriorityChange,
  onTagIdsChange,
  onDueDateFromChange,
  onDueDateToChange,
  onClearAll,
  className = '',
  alwaysExpanded = false
}: FilterPanelProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded)

  // Load tags on mount
  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const session = await getSession()
      const userId = session?.user?.id
      if (!userId) return

      const fetchedTags = await tagApi.listTags(userId)
      setTags(fetchedTags)
    } catch (err) {
      console.error('Failed to load tags:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTagToggle = (tagId: string) => {
    if (tagIds.includes(tagId)) {
      onTagIdsChange(tagIds.filter(id => id !== tagId))
    } else {
      onTagIdsChange([...tagIds, tagId])
    }
  }

  const activeFilterCount = [
    status,
    priority,
    tagIds.length > 0,
    dueDateFrom,
    dueDateTo
  ].filter(Boolean).length

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white whitespace-nowrap"
            >
              Clear all
            </button>
          )}
          {!alwaysExpanded && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter content */}
      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Status filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex gap-2">
              {['pending', 'completed'].map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(status === s ? null : s)}
                  className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                    status === s
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => onPriorityChange(priority === p ? null : p)}
                  className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                    priority === p
                      ? p === 'low'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                        : p === 'medium'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tag filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            {loading ? (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Loading tags...</p>
            ) : tags.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No tags available</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      tagIds.includes(tag.id)
                        ? 'border-2'
                        : 'border'
                    }`}
                    style={{
                      backgroundColor: tagIds.includes(tag.id) ? `${tag.color}30` : 'transparent',
                      color: tag.color,
                      borderColor: tag.color
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due date range filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date Range
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dueDateFrom || ''}
                  onChange={(e) => onDueDateFromChange(e.target.value || null)}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dueDateTo || ''}
                  onChange={(e) => onDueDateToChange(e.target.value || null)}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

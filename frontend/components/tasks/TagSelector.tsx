'use client'

import { useState, useEffect } from 'react'
import type { Tag } from '@/types'
import { tagApi } from '@/lib/api-client'
import { getSession } from '@/lib/auth'

interface TagSelectorProps {
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
  className?: string
}

export default function TagSelector({ selectedTagIds, onChange, className = '' }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6B7280')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setError('Failed to load tags')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      setLoading(true)
      setError(null)
      const session = await getSession()
      const userId = session?.user?.id
      if (!userId) return

      const newTag = await tagApi.createTag(userId, {
        name: newTagName.trim(),
        color: newTagColor
      })

      setTags([...tags, newTag])
      onChange([...selectedTagIds, newTag.id])
      setNewTagName('')
      setNewTagColor('#6B7280')
      setIsCreating(false)
    } catch (err: any) {
      console.error('Failed to create tag:', err)
      setError(err.message || 'Failed to create tag')
    } finally {
      setLoading(false)
    }
  }

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id))

  return (
    <div className={`relative ${className}`}>
      {/* Selected tags display */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
              borderColor: tag.color,
              borderWidth: '1px'
            }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className="ml-0.5 inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full hover:bg-black/10"
              style={{ color: tag.color }}
              aria-label={`Remove ${tag.name}`}
            >
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      {/* Dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          {selectedTags.length > 0 ? `${selectedTags.length} tag(s) selected` : 'Select tags...'}
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && (
            <div className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Loading tags...</div>
          )}

          {error && (
            <div className="px-3 py-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          {!loading && tags.length === 0 && (
            <div className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">No tags yet. Create one below!</div>
          )}

          {!loading && tags.map(tag => (
            <label
              key={tag.id}
              className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => handleToggleTag(tag.id)}
                className="mr-2 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: tag.color,
                  borderWidth: '1px'
                }}
              >
                {tag.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">({tag.task_count} tasks)</span>
            </label>
          ))}

          {/* Create new tag section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2 sm:p-3">
            {!isCreating ? (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full text-left text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                + Create new tag
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="h-8 w-10 sm:w-12 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || loading}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false)
                      setNewTagName('')
                      setNewTagColor('#6B7280')
                      setError(null)
                    }}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, CreateTagRequest, UpdateTagRequest } from '@/types'
import { tagApi } from '@/lib/api-client'
import { getSession } from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function TagsPage() {
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<CreateTagRequest>({ name: '', color: '#6B7280' })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      setError(null)
      const session = await getSession()
      const userId = session?.user?.id
      if (!userId) {
        router.push('/signin')
        return
      }

      const fetchedTags = await tagApi.listTags(userId)
      setTags(fetchedTags)
    } catch (err: any) {
      console.error('Failed to load tags:', err)
      setError(err.message || 'Failed to load tags')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) return

    try {
      setLoading(true)
      setError(null)
      const session = await getSession()
      const userId = session?.user?.id
      if (!userId) return

      await tagApi.createTag(userId, formData)
      await loadTags()
      setFormData({ name: '', color: '#6B7280' })
      setIsCreating(false)
    } catch (err: any) {
      console.error('Failed to create tag:', err)
      setError(err.message || 'Failed to create tag')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingTag || !formData.name.trim()) return

    try {
      setLoading(true)
      setError(null)
      const session = await getSession()
      const userId = session?.user?.id
      if (!userId) return

      await tagApi.updateTag(userId, editingTag.id, formData)
      await loadTags()
      setEditingTag(null)
      setFormData({ name: '', color: '#6B7280' })
    } catch (err: any) {
      console.error('Failed to update tag:', err)
      setError(err.message || 'Failed to update tag')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? It will be removed from all tasks.')) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const session = await getSession()
      const userId = session?.user?.id
      if (!userId) return

      await tagApi.deleteTag(userId, tagId)
      await loadTags()
    } catch (err: any) {
      console.error('Failed to delete tag:', err)
      setError(err.message || 'Failed to delete tag')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({ name: tag.name, color: tag.color })
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingTag(null)
    setIsCreating(false)
    setFormData({ name: '', color: '#6B7280' })
  }

  return (
    <>
      {/* Mobile Menu Drawer - Overlay style */}
      {isMobileMenuOpen && (
        <div className="fixed top-0 left-0 w-72 h-full bg-white dark:bg-gray-800 shadow-2xl z-50 lg:hidden">
          <div className="flex flex-col h-full">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">TF</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">TaskFlow</h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <a
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </a>
              <a
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>My Tasks</span>
              </a>
              <a
                href="/tags"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Manage Tags</span>
              </a>
            </nav>
          </div>
        </div>
      )}

      {/* Backdrop overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navbar */}
        <nav className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left: Logo + Title */}
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-base">TF</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      TaskFlow
                    </h1>
                    <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                      Organize your tasks with tags
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                <a
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </a>
                <a
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>My Tasks</span>
                </a>
                <a
                  href="/tags"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Manage Tags</span>
                </a>
              </div>
            </div>
          </div>
        </nav>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create and manage tags to organize your tasks
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingTag) && (
          <Card className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter tag name"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-16 sm:w-20 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {formData.color}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="primary"
                  onClick={editingTag ? handleUpdate : handleCreate}
                  disabled={!formData.name.trim() || loading}
                  className="w-full sm:w-auto"
                >
                  {editingTag ? 'Save Changes' : 'Create Tag'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={cancelEdit}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Create button */}
        {!isCreating && !editingTag && (
          <div className="mb-4 sm:mb-6">
            <Button
              variant="primary"
              onClick={() => setIsCreating(true)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              + Create New Tag
            </Button>
          </div>
        )}

        {/* Tags list */}
        {loading && tags.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Loading tags...</p>
          </div>
        ) : tags.length === 0 ? (
          <Card>
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                No tags yet. Create your first tag to get started!
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {tags.map((tag) => (
              <Card key={tag.id} className="hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex-shrink-0"
                      style={{ backgroundColor: tag.color, borderColor: tag.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {tag.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Used in {tag.task_count} {tag.task_count === 1 ? 'task' : 'tasks'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-2 sm:flex-shrink-0">
                    <button
                      onClick={() => startEdit(tag)}
                      disabled={loading}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      disabled={loading}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Task, CreateTaskRequest, UpdateTaskRequest } from '@/types'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import SearchBar from '@/components/tasks/SearchBar'
import FilterPanel from '@/components/tasks/FilterPanel'
import SortControls from '@/components/tasks/SortControls'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api-client'
import { getSession, signOut } from '@/lib/auth'
import ChatContainer from '@/components/chat/ChatContainer'

export function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [createSuccess, setCreateSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)

  // Task stats for cards
  const totalTasks = tasks.length
  const pendingTasks = tasks.filter(t => !t.completed).length
  const completedTasks = tasks.filter(t => t.completed).length
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.completed) return false
    const dueDate = new Date(t.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dueDate < today
  }).length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Search, filter, and sort state (initialized from URL params)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState<string | null>(searchParams.get('status'))
  const [priority, setPriority] = useState<string | null>(searchParams.get('priority'))
  const [tagIds, setTagIds] = useState<string[]>(searchParams.getAll('tag_ids'))
  const [dueDateFrom, setDueDateFrom] = useState<string | null>(searchParams.get('due_date_from'))
  const [dueDateTo, setDueDateTo] = useState<string | null>(searchParams.get('due_date_to'))
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sort_order') as 'asc' | 'desc') || 'desc')

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (priority) params.set('priority', priority)
    tagIds.forEach(id => params.append('tag_ids', id))
    if (dueDateFrom) params.set('due_date_from', dueDateFrom)
    if (dueDateTo) params.set('due_date_to', dueDateTo)
    if (sortBy !== 'created_at') params.set('sort_by', sortBy)
    if (sortOrder !== 'desc') params.set('sort_order', sortOrder)

    const queryString = params.toString()
    const newUrl = queryString ? `/dashboard?${queryString}` : '/dashboard'

    // Update URL without triggering navigation
    window.history.replaceState({}, '', newUrl)
  }, [search, status, priority, tagIds, dueDateFrom, dueDateTo, sortBy, sortOrder])

  // Fetch tasks with filters
  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      const session = await getSession()
      if (!session?.session?.token) {
        router.push('/signin')
        return
      }

      const user = session.user
      if (!user?.id) {
        throw new Error('User ID not found in session')
      }

      setUserId(user.id)
      setUserName(user.name || '')
      setUserEmail(user.email || '')

      // Build query parameters
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (priority) params.set('priority', priority)
      tagIds.forEach(id => params.append('tag_ids', id))
      if (dueDateFrom) params.set('due_date_from', dueDateFrom)
      if (dueDateTo) params.set('due_date_to', dueDateTo)
      params.set('sort_by', sortBy)
      params.set('sort_order', sortOrder)
      params.set('limit', '100')

      const queryString = params.toString()
      const endpoint = `/api/${user.id}/tasks${queryString ? `?${queryString}` : ''}`

      const fetchedTasks = await api.get<Task[]>(endpoint)
      setTasks(fetchedTasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  // Fetch tasks when filters change
  useEffect(() => {
    if (userId) {
      fetchTasks()
    }
  }, [userId, search, status, priority, tagIds, dueDateFrom, dueDateTo, sortBy, sortOrder])

  // Initial fetch
  useEffect(() => {
    fetchTasks()
  }, [])

  const handleCreateTask = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    if (!userId) {
      throw new Error('User not authenticated')
    }

    try {
      const createData = data as CreateTaskRequest
      const newTask = await api.post<Task>(`/api/${userId}/tasks`, createData)

      // Refresh task list to apply current filters
      await fetchTasks()

      setCreateSuccess(true)
      setTimeout(() => setCreateSuccess(false), 3000)

      // Close mobile create modal if open
      setIsCreateModalOpen(false)
    } catch (err) {
      throw err
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus(null)
    setPriority(null)
    setTagIds([])
    setDueDateFrom(null)
    setDueDateTo(null)
    setSortBy('created_at')
    setSortOrder('desc')
  }

  const activeFilterCount = [
    status,
    priority,
    tagIds.length > 0,
    dueDateFrom,
    dueDateTo,
    sortBy !== 'created_at' || sortOrder !== 'desc'
  ].filter(Boolean).length

  const handleRetry = () => {
    fetchTasks()
  }

  const handleToggleComplete = async (taskId: string) => {
    if (!userId) return

    const taskToToggle = tasks.find(t => t.id === taskId)
    if (!taskToToggle) return

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    )

    try {
      const updatedTask = await api.patch<Task>(
        `/api/${userId}/tasks/${taskId}/complete`
      )

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? updatedTask : task
        )
      )
    } catch (err) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, completed: taskToToggle.completed }
            : task
        )
      )

      setError(err instanceof Error ? err.message : 'Failed to update task')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleEdit = (taskId: string) => {
    router.push(`/tasks/${taskId}/edit`)
  }

  const handleDelete = async (taskId: string) => {
    setTaskToDelete(taskId)
  }

  const confirmDelete = async () => {
    if (!userId || !taskToDelete) return

    setDeleteLoading(true)
    setError(null)

    try {
      await api.delete(`/api/${userId}/tasks/${taskToDelete}`)
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskToDelete))

      setDeleteSuccess(true)
      setTimeout(() => setDeleteSuccess(false), 3000)

      setTaskToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      setTimeout(() => setError(null), 3000)
    } finally {
      setDeleteLoading(false)
    }
  }

  const cancelDelete = () => {
    setTaskToDelete(null)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (err) {
      console.error('Logout failed:', err)
      router.push('/signin')
    }
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
                className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>My Tasks</span>
                {pendingTasks > 0 && (
                  <span className="ml-auto flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {pendingTasks}
                  </span>
                )}
              </a>
              <a
                href="/tags"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-md sticky top-0 z-30 backdrop-blur-lg bg-white/95 dark:bg-gray-800/95">
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
                    Manage your tasks efficiently
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Desktop Navigation + User Menu */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Navigation Links */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
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
                  className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>My Tasks</span>
                  {pendingTasks > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                      {pendingTasks}
                    </span>
                  )}
                </a>
                <a
                  href="/tags"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Manage Tags</span>
                </a>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-3 ml-3 border-l border-gray-200 dark:border-gray-700">
                <div className="text-right">
                  {userName && (
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{userName}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Mobile: User Avatar with Dropdown */}
            <div className="lg:hidden relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors"
                aria-label="User menu"
              >
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{userEmail}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">

          {/* Stats Cards Section */}
          <div className="mb-3">
            {/* Mobile: 2-Column Grid - Horizontal Layout */}
            <div className="md:hidden grid grid-cols-2 gap-1.5">
              {/* Total Tasks Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded p-1.5 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-lg font-bold leading-none">{totalTasks}</p>
                    <p className="text-blue-100 text-[9px] font-medium leading-tight">Total</p>
                  </div>
                </div>
              </div>

              {/* Pending Tasks Card */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded p-1.5 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-lg font-bold leading-none">{pendingTasks}</p>
                    <p className="text-orange-100 text-[9px] font-medium leading-tight">Pending</p>
                  </div>
                </div>
              </div>

              {/* Completed Tasks Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded p-1.5 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-lg font-bold leading-none">{completedTasks}</p>
                    <p className="text-green-100 text-[9px] font-medium leading-tight">Done</p>
                  </div>
                </div>
              </div>

              {/* Overdue Tasks Card */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded p-1.5 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-lg font-bold leading-none">{overdueTasks}</p>
                    <p className="text-red-100 text-[9px] font-medium leading-tight">Overdue</p>
                  </div>
                </div>
              </div>

              {/* Progress Card - Spans 2 columns */}
              <div className="col-span-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded p-1.5 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-purple-100 text-[9px] font-medium">Progress</p>
                      <p className="text-white text-lg font-bold">{progressPercentage}%</p>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div
                        className="bg-white h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tablet & Desktop: Grid - Responsive */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-2">
              {/* Total Tasks Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-1.5 lg:p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium mb-1">Total</p>
                    <p className="text-white text-base lg:text-2xl font-bold">{totalTasks}</p>
                  </div>
                  <div className="w-6 h-6 lg:w-9 lg:h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Pending Tasks Card */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-1.5 lg:p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs font-medium mb-1">Pending</p>
                    <p className="text-white text-base lg:text-2xl font-bold">{pendingTasks}</p>
                  </div>
                  <div className="w-6 h-6 lg:w-9 lg:h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Completed Tasks Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-1.5 lg:p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs font-medium mb-1">Done</p>
                    <p className="text-white text-base lg:text-2xl font-bold">{completedTasks}</p>
                  </div>
                  <div className="w-6 h-6 lg:w-9 lg:h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Overdue Tasks Card */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-1.5 lg:p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-xs font-medium mb-1">Overdue</p>
                    <p className="text-white text-base lg:text-2xl font-bold">{overdueTasks}</p>
                  </div>
                  <div className="w-6 h-6 lg:w-9 lg:h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Progress Card */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-1.5 lg:p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 lg:w-9 lg:h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-purple-100 text-xs font-medium">Progress</p>
                      <p className="text-white text-base lg:text-2xl font-bold">{progressPercentage}%</p>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1 lg:h-2">
                      <div
                        className="bg-white h-1 lg:h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Create task form - hidden on mobile, visible on desktop */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-primary-900 dark:text-primary-300 mb-1">
                  ✨ Create New Task
                </h2>
                <p className="text-xs sm:text-sm text-primary-700 dark:text-primary-400">
                  Add a new task to your list
                </p>
              </div>
              <Card>
                <TaskForm onSubmit={handleCreateTask} />

                {createSuccess && (
                  <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ Task created successfully!
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Task list with search, filter, sort - full width on mobile */}
            <div className="lg:col-span-2">
              <div className="space-y-3 sm:space-y-4">
                {/* Search bar and mobile filter button */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchBar
                      value={search}
                      onChange={setSearch}
                      placeholder="Search tasks by title or description..."
                    />
                  </div>

                  {/* Mobile filter button - visible only on mobile/tablet */}
                  <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap text-sm font-medium"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-white text-blue-600 rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Active Filter Chips - All screens */}
                {activeFilterCount > 0 && (
                  <div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        Active:
                      </span>

                      {status && (
                        <button
                          onClick={() => setStatus(null)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium whitespace-nowrap hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{status === 'pending' ? 'Pending' : 'Completed'}</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                      {priority && (
                        <button
                          onClick={() => setPriority(null)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium whitespace-nowrap hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                      {tagIds.length > 0 && tagIds.map((tagId) => (
                        <button
                          key={tagId}
                          onClick={() => setTagIds(tagIds.filter(id => id !== tagId))}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium whitespace-nowrap hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span>Tag</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ))}

                      {(dueDateFrom || dueDateTo) && (
                        <button
                          onClick={() => {
                            setDueDateFrom(null)
                            setDueDateTo(null)
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium whitespace-nowrap hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Due Date</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                      {(sortBy !== 'created_at' || sortOrder !== 'desc') && (
                        <button
                          onClick={() => {
                            setSortBy('created_at')
                            setSortOrder('desc')
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium whitespace-nowrap hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                          </svg>
                          <span>
                            Sort: {sortBy === 'created_at' ? 'Created' : sortBy === 'due_date' ? 'Due Date' : sortBy === 'priority' ? 'Priority' : 'Title'}
                            {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                          </span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                      {activeFilterCount > 1 && (
                        <button
                          onClick={handleClearFilters}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium whitespace-nowrap hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span>Clear All</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Mobile Create Task Button - visible only on mobile */}
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create New Task</span>
                </button>

                {/* Desktop filter and sort controls - visible only on desktop */}
                <div className="hidden lg:flex flex-row gap-3 sm:gap-4">
                  <FilterPanel
                    status={status}
                    priority={priority}
                    tagIds={tagIds}
                    dueDateFrom={dueDateFrom}
                    dueDateTo={dueDateTo}
                    onStatusChange={setStatus}
                    onPriorityChange={setPriority}
                    onTagIdsChange={setTagIds}
                    onDueDateFromChange={setDueDateFrom}
                    onDueDateToChange={setDueDateTo}
                    onClearAll={handleClearFilters}
                    className="flex-1"
                  />
                  <SortControls
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortByChange={setSortBy}
                    onSortOrderChange={setSortOrder}
                    className="w-auto min-w-[280px]"
                  />
                </div>

                {deleteSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ Task deleted successfully!
                    </p>
                  </div>
                )}

                {createSuccess && (
                  <div className="lg:hidden bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ Task created successfully!
                    </p>
                  </div>
                )}

                {!loading && tasks.length === 0 && !error ? (
                  <Card>
                    <EmptyState
                      title={search || status || priority || tagIds.length > 0 ? "No tasks match your filters" : "No tasks yet"}
                      description={search || status || priority || tagIds.length > 0 ? "Try adjusting your search or filters" : "Get started by creating your first task. Stay organized and productive!"}
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-16 h-16"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                          />
                        </svg>
                      }
                    />
                  </Card>
                ) : (
                  <TaskList
                    tasks={tasks}
                    loading={loading}
                    error={error}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRetry={handleRetry}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Mobile Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filters & Sort"
        size="full"
      >
        <div className="space-y-6">
          {/* Active Filters Count */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                </span>
              </div>
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Filter Tasks</h3>
            </div>
            <FilterPanel
              status={status}
              priority={priority}
              tagIds={tagIds}
              dueDateFrom={dueDateFrom}
              dueDateTo={dueDateTo}
              onStatusChange={setStatus}
              onPriorityChange={setPriority}
              onTagIdsChange={setTagIds}
              onDueDateFromChange={setDueDateFrom}
              onDueDateToChange={setDueDateTo}
              onClearAll={handleClearFilters}
              alwaysExpanded={true}
            />
          </div>

          {/* Sort Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Sort By</h3>
            </div>
            <SortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              Apply Filters
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  handleClearFilters()
                  setIsFilterModalOpen(false)
                }}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Mobile Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
        size="full"
      >
        <TaskForm onSubmit={handleCreateTask} />
      </Modal>

      {/* AI Assistant FAB - All screens (Bottom Right) */}
      <button
        onClick={() => setIsChatModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full transition-all font-medium shadow-lg hover:shadow-xl hover:scale-105"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="text-sm">AI Assistant</span>
      </button>

      {/* Chat Modal - Right Side Drawer Style with Spacing */}
      {isChatModalOpen && (
        <>
          {/* Backdrop - Semi-transparent, dashboard visible */}
          <div
            className="fixed inset-0 bg-black/20 z-50 animate-fade-in"
            onClick={() => setIsChatModalOpen(false)}
          />

          {/* Chat Widget - Right Side with Margins */}
          <div className="fixed right-4 sm:right-6 top-4 sm:top-6 bottom-4 sm:bottom-6 z-50 w-[calc(100%-2rem)] sm:w-[380px] lg:w-[400px] animate-slide-in-right">
            <div className="relative h-full bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200">
              {/* Close Button - Top Right */}
              <button
                onClick={() => setIsChatModalOpen(false)}
                className="absolute top-3 right-3 z-10 w-9 h-9 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Chat Container */}
              <div className="flex-1 overflow-hidden">
                <ChatContainer />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Task, CreateTaskRequest, UpdateTaskRequest } from '@/types'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { api } from '@/lib/api-client'
import { getSession, signOut } from '@/lib/auth'

export default function DashboardPage() {
  const router = useRouter()
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

  // Fetch user session and tasks
  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get session to extract user_id
      const session = await getSession()

      if (!session?.session?.token) {
        router.push('/signin')
        return
      }

      // Extract user_id from session
      const user = session.user
      if (!user?.id) {
        throw new Error('User ID not found in session')
      }

      setUserId(user.id)
      setUserName(user.name || '')
      setUserEmail(user.email || '')

      // Fetch tasks for this user
      const fetchedTasks = await api.get<Task[]>(`/api/${user.id}/tasks`)
      setTasks(fetchedTasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [router])

  const handleCreateTask = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    if (!userId) {
      throw new Error('User not authenticated')
    }

    try {
      // Cast to CreateTaskRequest since we know title is required in create mode
      const createData = data as CreateTaskRequest
      const newTask = await api.post<Task>(`/api/${userId}/tasks`, createData)

      // Add new task to the list
      setTasks(prevTasks => [newTask, ...prevTasks])

      // Show success feedback
      setCreateSuccess(true)
      setTimeout(() => setCreateSuccess(false), 3000)
    } catch (err) {
      throw err // Let TaskForm handle the error
    }
  }

  const handleRetry = () => {
    fetchTasks()
  }

  const handleToggleComplete = async (taskId: string) => {
    if (!userId) return

    // Find the task to toggle
    const taskToToggle = tasks.find(t => t.id === taskId)
    if (!taskToToggle) return

    // Optimistic UI update
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    )

    try {
      // Call API to toggle completion
      const updatedTask = await api.patch<Task>(
        `/api/${userId}/tasks/${taskId}/complete`
      )

      // Update with server response
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? updatedTask : task
        )
      )
    } catch (err) {
      // Revert on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, completed: taskToToggle.completed }
            : task
        )
      )

      // Show error message
      setError(err instanceof Error ? err.message : 'Failed to update task')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleEdit = (taskId: string) => {
    router.push(`/tasks/${taskId}/edit`)
  }

  const handleDelete = async (taskId: string) => {
    // Show confirmation dialog
    setTaskToDelete(taskId)
  }

  const confirmDelete = async () => {
    if (!userId || !taskToDelete) return

    setDeleteLoading(true)
    setError(null)

    try {
      // Call API to delete task
      await api.delete(`/api/${userId}/tasks/${taskToDelete}`)

      // Remove task from list
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskToDelete))

      // Show success feedback
      setDeleteSuccess(true)
      setTimeout(() => setDeleteSuccess(false), 3000)

      // Close dialog
      setTaskToDelete(null)
    } catch (err) {
      // Show error message
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
      // Force redirect even if signout fails
      router.push('/signin')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Tasks
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and organize your daily tasks
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* User profile display */}
              <div className="hidden sm:block text-right">
                {userName && (
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                )}
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create task form */}
          <div className="lg:col-span-1">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
              <h2 className="text-lg font-semibold text-primary-900 mb-1">
                ✨ Create New Task
              </h2>
              <p className="text-sm text-primary-700">
                Add a new task to your list
              </p>
            </div>
            <Card>
              <TaskForm onSubmit={handleCreateTask} />

              {createSuccess && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-600">
                    ✓ Task created successfully!
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Task list */}
          <div className="lg:col-span-2">
            {deleteSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-600">
                  ✓ Task deleted successfully!
                </p>
              </div>
            )}

            {!loading && tasks.length === 0 && !error ? (
              <Card>
                <EmptyState
                  title="No tasks yet"
                  description="Get started by creating your first task. Stay organized and productive!"
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
      </main>

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
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreateTaskRequest } from '@/types'
import { TaskForm } from '@/components/tasks/TaskForm'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api-client'
import { getSession } from '@/lib/auth'

export default function NewTaskPage() {
  const router = useRouter()
  const [createLoading, setCreateLoading] = useState(false)

  const handleCreateTask = async (data: CreateTaskRequest) => {
    setCreateLoading(true)

    try {
      const session = await getSession()
      if (!session?.session?.token) {
        router.push('/signin')
        return
      }

      const user = session.user
      if (!user?.id) {
        throw new Error('User ID not found in session')
      }

      // Create task via API
      await api.post(`/api/${user.id}/tasks`, data)

      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (err) {
      setCreateLoading(false)
      throw err // Let TaskForm handle the error
    }
  }

  const handleCancel = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              title="Back to dashboard"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Create New Task</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Task Details
          </h2>
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={handleCancel}
            loading={createLoading}
          />
        </Card>
      </main>
    </div>
  )
}

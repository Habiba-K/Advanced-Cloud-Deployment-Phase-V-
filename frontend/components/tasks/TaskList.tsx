'use client'

import { Task } from '@/types'
import { TaskCard } from './TaskCard'
import { TaskListSkeleton } from '@/components/ui/Loading'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

interface TaskListProps {
  tasks: Task[]
  loading: boolean
  error: string | null
  onToggleComplete?: (taskId: string) => Promise<void>
  onEdit?: (taskId: string) => void
  onDelete?: (taskId: string) => Promise<void>
  onRetry?: () => void
}

export function TaskList({
  tasks,
  loading,
  error,
  onToggleComplete,
  onEdit,
  onDelete,
  onRetry
}: TaskListProps) {
  // Loading state with skeleton
  if (loading) {
    return <TaskListSkeleton count={5} />
  }

  // Error state with retry
  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <svg
            className="w-8 h-8 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No tasks yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create your first task to get started!
        </p>
      </div>
    )
  }

  // Task list
  return (
    <div className="space-y-3 sm:space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { Task } from '@/types'
import { Card } from '@/components/ui/Card'
import { formatRelativeTime } from '@/lib/utils'
import PriorityBadge from './PriorityBadge'
import TagChip from './TagChip'

interface TaskCardProps {
  task: Task
  onToggleComplete?: (taskId: string) => Promise<void>
  onEdit?: (taskId: string) => void
  onDelete?: (taskId: string) => Promise<void>
}

export function TaskCard({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('input')
    ) {
      return
    }
    router.push(`/tasks/${task.id}`)
  }

  // Priority border colors
  const priorityBorderColors = {
    low: 'border-l-green-500',
    medium: 'border-l-blue-500',
    high: 'border-l-red-500'
  }

  return (
    <Card
      className={`hover:shadow-lg dark:hover:shadow-xl transition-all duration-200 cursor-pointer border-l-4 ${priorityBorderColors[task.priority]}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Completion checkbox */}
        <div className="flex-shrink-0 mt-0.5 sm:mt-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleComplete?.(task.id)}
            className="w-5 h-5 sm:w-5 sm:h-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-400 cursor-pointer dark:bg-gray-700"
          />
        </div>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 mb-1">
            <h3
              className={`text-base sm:text-lg font-semibold flex-1 ${
                task.completed
                  ? 'line-through text-gray-500 dark:text-gray-500'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {task.title}
            </h3>
            <div className="self-start">
              <PriorityBadge priority={task.priority} />
            </div>
          </div>

          {task.description && (
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1 sm:gap-1.5">
              {task.tags.map(tag => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </div>
          )}

          <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Created {formatRelativeTime(task.created_at)}</span>
              <span className="sm:hidden">{formatRelativeTime(task.created_at)}</span>
            </span>

            {task.due_date && (
              <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 font-medium">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                <span className="sm:hidden">{new Date(task.due_date).toLocaleDateString()}</span>
              </span>
            )}

            {task.remind_at && (
              <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-medium">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="hidden sm:inline">Reminder: {new Date(task.remind_at).toLocaleString()}</span>
                <span className="sm:hidden">{new Date(task.remind_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            )}

            {task.completed && task.completed_at && (
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-medium">
                <span className="hidden sm:inline">✓ Completed {formatRelativeTime(task.completed_at)}</span>
                <span className="sm:hidden">✓ {formatRelativeTime(task.completed_at)}</span>
              </span>
            )}

            {task.completed && !task.completed_at && (
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-medium">
                ✓ Completed
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex flex-row gap-1 sm:gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(task.id)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              title="Edit task"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete task"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CreateTaskRequest, UpdateTaskRequest, Task, TaskPriority } from '@/types'
import TagSelector from './TagSelector'

interface TaskFormProps {
  task?: Task // Optional for edit mode
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => Promise<void>
  onSuccess?: () => void
  onCancel?: () => void
  loading?: boolean
}

export function TaskForm({ task, onSubmit, onSuccess, onCancel, loading: externalLoading }: TaskFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [internalLoading, setInternalLoading] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>(task?.priority || 'medium')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(task?.tags?.map(t => t.id) || [])
  const [dueDate, setDueDate] = useState<string>(task?.due_date || '')
  const [remindAt, setRemindAt] = useState<string>(task?.remind_at ? task.remind_at.slice(0, 16) : '')
  const [dateValidationError, setDateValidationError] = useState<string>('')

  const loading = externalLoading || internalLoading
  const isEditMode = !!task

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateTaskRequest>({
    defaultValues: task ? {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      tag_ids: task.tags?.map(t => t.id) || [],
      due_date: task.due_date || undefined,
      remind_at: task.remind_at || undefined
    } : {
      priority: 'medium',
      tag_ids: []
    }
  })

  // Update form when task prop changes
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        tag_ids: task.tags?.map(t => t.id) || [],
        due_date: task.due_date || undefined,
        remind_at: task.remind_at || undefined
      })
      setSelectedPriority(task.priority)
      setSelectedTagIds(task.tags?.map(t => t.id) || [])

      // Format dates for HTML inputs
      const formattedDueDate = task.due_date || ''
      const formattedRemindAt = task.remind_at ? task.remind_at.slice(0, 16) : ''

      setDueDate(formattedDueDate)
      setRemindAt(formattedRemindAt)
    }
  }, [task, reset])

  // Validate reminder date is before due date
  useEffect(() => {
    setDateValidationError('')

    if (dueDate && remindAt) {
      const dueDateObj = new Date(dueDate)
      const remindAtObj = new Date(remindAt)

      if (remindAtObj >= dueDateObj) {
        setDateValidationError('Reminder must be set before the due date')
      }
    }
  }, [dueDate, remindAt])

  const handleFormSubmit = async (data: CreateTaskRequest) => {
    // Validate dates before submission
    if (dateValidationError) {
      setError(dateValidationError)
      return
    }

    setInternalLoading(true)
    setError(null)

    try {
      // Include priority, tag_ids, due_date, and remind_at in submission
      // For edit mode, explicitly send null for cleared fields
      // For create mode, send undefined for empty fields
      const submitData = {
        title: data.title,
        description: data.description || '',
        priority: selectedPriority,
        tag_ids: selectedTagIds,
        due_date: dueDate ? dueDate : (isEditMode ? null : undefined),
        remind_at: remindAt ? remindAt : (isEditMode ? null : undefined)
      }

      await onSubmit(submitData)
      if (!isEditMode) {
        reset() // Reset form after successful creation
        setSelectedPriority('medium')
        setSelectedTagIds([])
        setDueDate('')
        setRemindAt('')
      }
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} task`)
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-4">
      <Input
        label="Task Title"
        placeholder="What needs to be done?"
        {...register('title', {
          required: 'Title is required',
          maxLength: {
            value: 500,
            message: 'Title must be less than 500 characters'
          }
        })}
        error={errors.title?.message}
        disabled={loading}
      />

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="Add more details..."
          {...register('description', {
            maxLength: {
              value: 5000,
              message: 'Description must be less than 5000 characters'
            }
          })}
          disabled={loading}
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* Priority Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Priority
        </label>
        <div className="flex flex-wrap gap-2">
          {(['low', 'medium', 'high'] as TaskPriority[]).map((priority) => (
            <label
              key={priority}
              className={`flex items-center justify-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPriority === priority
                  ? priority === 'low'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : priority === 'medium'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                value={priority}
                checked={selectedPriority === priority}
                onChange={(e) => setSelectedPriority(e.target.value as TaskPriority)}
                className="sr-only"
                disabled={loading}
              />
              <span
                className={`text-sm font-medium ${
                  selectedPriority === priority
                    ? priority === 'low'
                      ? 'text-green-700 dark:text-green-400'
                      : priority === 'medium'
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-red-700 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tag Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags (optional)
        </label>
        <TagSelector
          selectedTagIds={selectedTagIds}
          onChange={setSelectedTagIds}
        />
      </div>

      {/* Due Date and Reminder - Stack on mobile, side-by-side on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Due Date Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Due Date (optional)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
        </div>

        {/* Reminder DateTime Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reminder (optional)
          </label>
          <input
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
        </div>
      </div>

      {/* Date Validation Error */}
      {dateValidationError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {dateValidationError}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          fullWidth={!isEditMode}
          loading={loading}
          disabled={loading}
          className="py-3"
        >
          {isEditMode ? 'Save Changes' : 'Add Task'}
        </Button>

        {isEditMode && onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="py-3"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

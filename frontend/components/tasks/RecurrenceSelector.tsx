'use client'

import { RecurrencePattern } from '@/types'

interface RecurrenceSelectorProps {
  pattern: RecurrencePattern
  interval: number
  onPatternChange: (pattern: RecurrencePattern) => void
  onIntervalChange: (interval: number) => void
  disabled?: boolean
}

const patternLabels: Record<RecurrencePattern, string> = {
  none: 'No Repeat',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

const intervalUnits: Record<string, string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
}

export default function RecurrenceSelector({
  pattern,
  interval,
  onPatternChange,
  onIntervalChange,
  disabled = false,
}: RecurrenceSelectorProps) {
  const showInterval = pattern !== 'none'

  const getDescription = () => {
    if (pattern === 'none') return null
    const unit = intervalUnits[pattern]
    const plural = interval > 1 ? `${unit}s` : unit
    return `Repeats every ${interval} ${plural}`
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Recurrence (optional)
      </label>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[140px]">
          <select
            value={pattern}
            onChange={(e) => onPatternChange(e.target.value as RecurrencePattern)}
            disabled={disabled}
            className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {(Object.keys(patternLabels) as RecurrencePattern[]).map((p) => (
              <option key={p} value={p}>
                {patternLabels[p]}
              </option>
            ))}
          </select>
        </div>

        {showInterval && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Every</span>
            <input
              type="number"
              min={1}
              max={365}
              value={interval}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val) && val >= 1) onIntervalChange(val)
              }}
              disabled={disabled}
              className="w-20 px-3 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {intervalUnits[pattern]}{interval > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {getDescription() && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {getDescription()}
        </p>
      )}
    </div>
  )
}

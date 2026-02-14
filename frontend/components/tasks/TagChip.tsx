import type { TagSummary } from '@/types'

interface TagChipProps {
  tag: TagSummary
  onRemove?: () => void
  className?: string
}

export default function TagChip({ tag, onRemove, className = '' }: TagChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${tag.color}20`, // 20% opacity
        color: tag.color,
        borderColor: tag.color,
        borderWidth: '1px'
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{ color: tag.color }}
          aria-label={`Remove ${tag.name} tag`}
        >
          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  )
}

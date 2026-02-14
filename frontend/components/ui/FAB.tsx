'use client'

interface FABProps {
  onClick: () => void
  icon?: React.ReactNode
  label?: string
}

export function FAB({ onClick, icon, label = 'Add' }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-30 lg:hidden"
      aria-label={label}
    >
      {icon || (
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      )}
      <span className="font-medium text-sm whitespace-nowrap">{label}</span>
    </button>
  )
}

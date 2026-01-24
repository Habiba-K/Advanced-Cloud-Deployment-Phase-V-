import React from 'react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

export function FeatureCard({
  icon,
  title,
  description,
  className
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg p-6 shadow-sm',
        className
      )}
    >
      <div className="w-12 h-12 flex items-center justify-center bg-primary-100 text-primary-600 rounded-lg mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        {title}
      </h3>
      <p className="text-sm text-gray-600 mt-2">
        {description}
      </p>
    </div>
  )
}

import React from 'react'
import { cn } from '@/lib/utils'

interface SectionProps {
  spacing?: 'sm' | 'md' | 'lg'
  background?: 'white' | 'gray' | 'primary'
  children: React.ReactNode
  className?: string
}

export function Section({
  spacing = 'md',
  background = 'white',
  children,
  className
}: SectionProps) {
  const spacingStyles = {
    sm: 'py-6 md:py-8',
    md: 'py-8 md:py-12 lg:py-16',
    lg: 'py-12 md:py-16 lg:py-20'
  }

  const backgroundStyles = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    primary: 'bg-primary-50'
  }

  return (
    <section
      className={cn(
        spacingStyles[spacing],
        backgroundStyles[background],
        className
      )}
    >
      {children}
    </section>
  )
}

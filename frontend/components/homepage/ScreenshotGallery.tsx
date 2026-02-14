'use client'

import { useState } from 'react'
import AnimatedSection from '@/components/ui/AnimatedSection'

interface Screenshot {
  src: string
  alt: string
  title: string
  description: string
}

const screenshots: Screenshot[] = [
  {
    src: '/dashboard.JPG',
    alt: 'Dashboard Screenshot',
    title: 'Smart Dashboard',
    description: 'Track progress with visual stats'
  },
  {
    src: '/filters.JPG',
    alt: 'Filters Screenshot',
    title: 'Advanced Filters',
    description: 'Search, filter, and sort tasks'
  },
  {
    src: '/ai assistant.JPG',
    alt: 'AI Chat Screenshot',
    title: 'AI Assistant',
    description: 'Chat with AI for help'
  }
]

export function ScreenshotGallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {screenshots.map((screenshot, index) => (
          <AnimatedSection key={screenshot.src} delay={150 + index * 50}>
            <div
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              onClick={() => setSelectedImage(screenshot.src)}
            >
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                <img
                  src={screenshot.src}
                  alt={screenshot.alt}
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{screenshot.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{screenshot.description}</p>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Zoomed screenshot"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

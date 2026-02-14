'use client'

import { useEffect, useRef, useState } from 'react'

interface LiveCounterProps {
  initialValue: number
  minIncrement: number
  maxIncrement: number
  updateInterval?: number // milliseconds between updates
  suffix?: string
  decimals?: number
  className?: string
}

export function LiveCounter({
  initialValue,
  minIncrement,
  maxIncrement,
  updateInterval = 3000,
  suffix = '',
  decimals = 0,
  className = ''
}: LiveCounterProps) {
  const [count, setCount] = useState(0)
  const [targetCount, setTargetCount] = useState(initialValue)
  const [isVisible, setIsVisible] = useState(false)
  const [hasInitialAnimationCompleted, setHasInitialAnimationCompleted] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  // Intersection Observer to detect when component is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current)
      }
    }
  }, [isVisible])

  // Initial count-up animation
  useEffect(() => {
    if (!isVisible || hasInitialAnimationCompleted) return

    const duration = 2000
    const startTime = Date.now()
    const endTime = startTime + duration

    const updateCount = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)

      const currentCount = easeOutQuart * initialValue
      setCount(currentCount)

      if (now < endTime) {
        requestAnimationFrame(updateCount)
      } else {
        setCount(initialValue)
        setHasInitialAnimationCompleted(true)
      }
    }

    requestAnimationFrame(updateCount)
  }, [isVisible, initialValue, hasInitialAnimationCompleted])

  // Random increments after initial animation
  useEffect(() => {
    if (!hasInitialAnimationCompleted) return

    const interval = setInterval(() => {
      const randomIncrement = Math.random() * (maxIncrement - minIncrement) + minIncrement
      setTargetCount(prev => prev + randomIncrement)
    }, updateInterval)

    return () => clearInterval(interval)
  }, [hasInitialAnimationCompleted, minIncrement, maxIncrement, updateInterval])

  // Smooth transition to new target
  useEffect(() => {
    if (!hasInitialAnimationCompleted) return

    const duration = 1000
    const startValue = count
    const startTime = Date.now()
    const endTime = startTime + duration

    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Smooth easing
      const easeInOutQuad = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      const currentValue = startValue + (targetCount - startValue) * easeInOutQuad
      setCount(currentValue)

      if (now < endTime) {
        requestAnimationFrame(animate)
      } else {
        setCount(targetCount)
      }
    }

    requestAnimationFrame(animate)
  }, [targetCount, hasInitialAnimationCompleted])

  const formatNumber = (num: number) => {
    if (decimals > 0) {
      return num.toFixed(decimals)
    }
    return Math.floor(num).toLocaleString()
  }

  return (
    <div ref={elementRef} className={className}>
      {formatNumber(count)}{suffix}
    </div>
  )
}

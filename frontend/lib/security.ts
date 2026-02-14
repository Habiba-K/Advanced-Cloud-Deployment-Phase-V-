/**
 * Security utilities for input sanitization and XSS prevention
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''

  // Create a temporary div element
  const temp = document.createElement('div')
  temp.textContent = input

  return temp.innerHTML
}

/**
 * Sanitize user input by removing dangerous characters
 * Allows basic punctuation but removes script-related characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onerror, etc.)
    .trim()
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const sanitized = email.trim().toLowerCase()

  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format')
  }

  return sanitized
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  const sanitized = url.trim()

  // Block dangerous protocols
  if (
    sanitized.toLowerCase().startsWith('javascript:') ||
    sanitized.toLowerCase().startsWith('data:') ||
    sanitized.toLowerCase().startsWith('vbscript:')
  ) {
    return ''
  }

  return sanitized
}

/**
 * Escape special characters for safe display in HTML
 */
export function escapeHtml(text: string): string {
  if (!text) return ''

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }

  return text.replace(/[&<>"'/]/g, (char) => map[char])
}

/**
 * Validate string length
 */
export function validateLength(
  input: string,
  minLength: number,
  maxLength: number,
  fieldName: string = 'Input'
): string {
  const trimmed = input.trim()

  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`)
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must not exceed ${maxLength} characters`)
  }

  return trimmed
}

/**
 * Sanitize task title
 */
export function sanitizeTaskTitle(title: string): string {
  const sanitized = sanitizeInput(title)
  return validateLength(sanitized, 1, 500, 'Task title')
}

/**
 * Sanitize task description
 */
export function sanitizeTaskDescription(description: string): string {
  if (!description) return ''
  return sanitizeInput(description).slice(0, 5000) // Max 5000 chars
}

/**
 * Sanitize tag name
 */
export function sanitizeTagName(name: string): string {
  const sanitized = sanitizeInput(name)
  return validateLength(sanitized, 1, 50, 'Tag name')
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return ''
  return sanitizeInput(query).slice(0, 200) // Max 200 chars for search
}

/**
 * Rate limiting helper - tracks request counts per time window
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  /**
   * Check if request is allowed for given key (e.g., user ID or IP)
   */
  isAllowed(key: string): boolean {
    const now = Date.now()
    const timestamps = this.requests.get(key) || []

    // Remove timestamps outside the current window
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    )

    if (validTimestamps.length >= this.maxRequests) {
      return false
    }

    validTimestamps.push(now)
    this.requests.set(key, validTimestamps)

    return true
  }

  /**
   * Clear rate limit data for a key
   */
  clear(key: string): void {
    this.requests.delete(key)
  }
}

// Export singleton rate limiter instance
export const rateLimiter = new RateLimiter()

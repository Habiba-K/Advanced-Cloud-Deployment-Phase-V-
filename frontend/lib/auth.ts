// Client-side auth helpers
// Note: Actual authentication is handled by the FastAPI backend
// This file provides client-side session management using localStorage

interface User {
  id: string
  email: string
  name?: string
}

interface Session {
  session: {
    token: string
  }
  user: User
}

// Get session from localStorage
export const getSession = async (): Promise<Session | null> => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('auth_user')

    if (!token || !userStr) {
      return null
    }

    const user = JSON.parse(userStr) as User

    return {
      session: {
        token
      },
      user
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Set session after successful login
export const setSession = (token: string, user: User) => {
  if (typeof window === 'undefined') {
    return
  }

  // Store in localStorage
  localStorage.setItem('auth_token', token)
  localStorage.setItem('auth_user', JSON.stringify(user))

  // Also set a cookie for middleware to check (server-side)
  // Cookie expires in 7 days
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7)
  document.cookie = `auth_token=${token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`
}

// Sign out - clear session
export const signOut = async () => {
  if (typeof window === 'undefined') {
    return
  }

  // Clear localStorage
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')

  // Clear the auth_token cookie
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'

  // Clear any other cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
  })
}

// Hook for session management
export const useSession = () => {
  // This is a placeholder for client-side session state
  // In a real implementation, this would use React hooks to manage state
  return { session: null, loading: false }
}

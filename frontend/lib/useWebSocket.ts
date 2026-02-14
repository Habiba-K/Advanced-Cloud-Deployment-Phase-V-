'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { wsClient, TaskWebSocketMessage } from './websocket'

export function useWebSocket(
  userId: string | null,
  onMessage: (message: TaskWebSocketMessage) => void
) {
  const [isConnected, setIsConnected] = useState(false)
  const callbackRef = useRef(onMessage)
  callbackRef.current = onMessage

  useEffect(() => {
    if (!userId) return

    wsClient.connect(userId)

    const unsubscribe = wsClient.onMessage((msg) => {
      callbackRef.current(msg)
    })

    // Poll connection status
    const statusInterval = setInterval(() => {
      setIsConnected(wsClient.isConnected)
    }, 2000)

    // Set initial status after a brief delay
    const initTimeout = setTimeout(() => {
      setIsConnected(wsClient.isConnected)
    }, 500)

    return () => {
      unsubscribe()
      clearInterval(statusInterval)
      clearTimeout(initTimeout)
      wsClient.disconnect()
      setIsConnected(false)
    }
  }, [userId])

  return { isConnected }
}

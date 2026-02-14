const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8004'

export interface TaskWebSocketMessage {
  type: 'created' | 'updated' | 'completed' | 'deleted' | 'notification' | 'pong'
  task_id?: string
  task_data?: Record<string, any>
  timestamp?: string
}

type MessageHandler = (message: TaskWebSocketMessage) => void

class TaskWebSocketClient {
  private ws: WebSocket | null = null
  private userId: string | null = null
  private handlers: Set<MessageHandler> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private isIntentionallyClosed = false

  connect(userId: string): void {
    this.userId = userId
    this.isIntentionallyClosed = false

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    try {
      this.ws = new WebSocket(`${WS_BASE_URL}/ws/${userId}`)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.startPing()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: TaskWebSocketMessage = JSON.parse(event.data)
          if (message.type === 'pong') return
          this.handlers.forEach((handler) => handler(message))
        } catch {
          // Ignore malformed messages
        }
      }

      this.ws.onclose = () => {
        this.stopPing()
        if (!this.isIntentionallyClosed) {
          this.attemptReconnect()
        }
      }

      this.ws.onerror = () => {
        // onclose will fire after this
      }
    } catch {
      this.attemptReconnect()
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true
    this.stopPing()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler)
    return () => {
      this.handlers.delete(handler)
    }
  }

  private startPing(): void {
    this.stopPing()
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping')
      }
    }, 30000)
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private attemptReconnect(): void {
    if (this.isIntentionallyClosed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++

    this.reconnectTimer = setTimeout(() => {
      if (this.userId && !this.isIntentionallyClosed) {
        this.connect(this.userId)
      }
    }, delay)
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsClient = new TaskWebSocketClient()

import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  connect() {
    if (this.socket?.connected) return

    this.socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected')
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected')
    })

    this.socket.on('dataChanged', (data) => {
      console.log('📡 Data changed:', data)
      this.emitToListeners('dataChanged', data)
    })

    this.socket.on('stock:updated', (data) => {
      console.log('📦 Stock updated:', data)
      this.emitToListeners('stock:updated', data)
    })

    this.socket.on('notification:new', (data) => {
      console.log('🔔 New notification:', data)
      this.emitToListeners('notification:new', data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback)
  }

  private emitToListeners(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (err) {
        console.error('Listener error:', err)
      }
    })
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const socketService = new SocketService()

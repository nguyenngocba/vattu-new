import { useEffect, useState } from 'react'
import { socketService } from '../services/socket.service'

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<any>(null)

  useEffect(() => {
    socketService.connect()
    setIsConnected(socketService.isConnected())

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)
    const handleDataChanged = (data: any) => setLastUpdate(data)

    socketService.on('connect', handleConnect)
    socketService.on('disconnect', handleDisconnect)
    socketService.on('dataChanged', handleDataChanged)

    return () => {
      socketService.off('connect', handleConnect)
      socketService.off('disconnect', handleDisconnect)
      socketService.off('dataChanged', handleDataChanged)
    }
  }, [])

  return { isConnected, lastUpdate }
}

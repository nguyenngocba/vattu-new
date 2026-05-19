import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'

const RealtimeBridge = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] })
    socket.on('dataChanged', () => {
      queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
    })
    return () => {
      socket.disconnect()
    }
  }, [queryClient])

  return null
}

export default RealtimeBridge

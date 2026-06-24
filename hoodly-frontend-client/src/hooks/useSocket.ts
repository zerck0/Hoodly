/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { getAccessToken } from '../lib/axios'
import { useAuthStore } from '../stores/auth.store'

let socketInstance: Socket | null = null

export function useSocket() {
  const user = useAuthStore((state) => state.user)
  const [isConnected, setIsConnected] = useState(socketInstance?.connected || false)

  useEffect(() => {
    if (!user) {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
        setIsConnected(false)
      }
      return
    }

    if (!socketInstance) {
      let backendUrl = import.meta.env.VITE_API_URL
      if (backendUrl.endsWith('/api')) {
        backendUrl = backendUrl.substring(0, backendUrl.length - 4)
      } else if (backendUrl.endsWith('/api/')) {
        backendUrl = backendUrl.substring(0, backendUrl.length - 5)
      }

      socketInstance = io(backendUrl, {
        autoConnect: false,
        auth: (cb) => {
          if (getAccessToken) {
            getAccessToken()
              .then((token) => cb({ token }))
              .catch(() => cb({ token: '' }))
          } else {
            cb({ token: '' })
          }
        },
      })

      socketInstance.connect()
    }

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socketInstance.on('connect', onConnect)
    socketInstance.on('disconnect', onDisconnect)

    setIsConnected(socketInstance.connected)

    return () => {
      if (socketInstance) {
        socketInstance.off('connect', onConnect)
        socketInstance.off('disconnect', onDisconnect)
      }
    }
  }, [user])

  return {
    socket: socketInstance,
    isConnected,
  }
}

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const WebSocketContext = createContext()

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const { user, token } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const socketRef = useRef(null)

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !token) {
      // User not authenticated, disconnect if connected
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Create WebSocket connection
    const newSocket = io(process.env.REACT_APP_WS_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected')
      setIsConnected(true)
      setConnectionError(null)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason)
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error)
      setConnectionError(error.message)
      setIsConnected(false)
    })

    // Welcome message
    newSocket.on('connected', (data) => {
      console.log('✅ WebSocket authenticated:', data.message)
    })

    // Notification events
    newSocket.on('system_notification', (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep last 50
      setUnreadCount(prev => prev + 1)
      
      // Show browser notification if supported and permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: `notification-${notification.id}`
        })
      }
    })

    newSocket.on('medication_reminder', (data) => {
      const notification = {
        id: Date.now(),
        type: 'medication_reminder',
        title: 'Medication Reminder',
        message: `Time to take ${data.medication.name}`,
        data: data,
        timestamp: data.timestamp,
        priority: 'high'
      }
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)])
      setUnreadCount(prev => prev + 1)
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: 'medication-reminder'
        })
      }
    })

    newSocket.on('adherence_alert', (data) => {
      const notification = {
        id: Date.now(),
        type: 'adherence_alert',
        title: 'Adherence Alert',
        message: `Your adherence rate is ${data.data.adherence_rate}%`,
        data: data,
        timestamp: data.timestamp,
        priority: 'high'
      }
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)])
      setUnreadCount(prev => prev + 1)
    })

    // Message events
    newSocket.on('new_message', (message) => {
      console.log('📨 New message received:', message)
      // Handle new message (you can add message state management here)
    })

    newSocket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data.username)
      // Handle typing indicator
    })

    // Medication events for caretakers
    newSocket.on('patient_medication_taken', (data) => {
      if (user.role === 'caretaker') {
        const notification = {
          id: Date.now(),
          type: 'patient_update',
          title: 'Patient Update',
          message: `${data.patientName} took ${data.medicationName}`,
          data: data,
          timestamp: data.timestamp,
          priority: 'medium'
        }
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)])
        setUnreadCount(prev => prev + 1)
      }
    })

    newSocket.on('patient_medication_missed', (data) => {
      if (user.role === 'caretaker') {
        const notification = {
          id: Date.now(),
          type: 'patient_alert',
          title: 'Patient Alert',
          message: `${data.patientName} missed ${data.medicationName}`,
          data: data,
          timestamp: data.timestamp,
          priority: 'high'
        }
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)])
        setUnreadCount(prev => prev + 1)
      }
    })

    // Subscribe to notifications
    newSocket.emit('subscribe_notifications')

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect()
      }
    }
  }, [user, token])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission)
      })
    }
  }, [])

  // WebSocket utility functions
  const emitMedicationTaken = (medicationData) => {
    if (socket && isConnected) {
      socket.emit('medication_taken', {
        medicationId: medicationData.id,
        medicationName: medicationData.name,
        notes: medicationData.notes
      })
    }
  }

  const emitMedicationMissed = (medicationData) => {
    if (socket && isConnected) {
      socket.emit('medication_missed', {
        medicationId: medicationData.id,
        medicationName: medicationData.name,
        notes: medicationData.notes
      })
    }
  }

  const emitMedicationAdded = (medication) => {
    if (socket && isConnected) {
      socket.emit('medication_added', { medication })
    }
  }

  const sendMessage = (recipientId, message, type = 'text') => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        recipientId,
        message,
        type
      })
    }
  }

  const startTyping = (recipientId) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { recipientId })
    }
  }

  const stopTyping = (recipientId) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { recipientId })
    }
  }

  const joinPatientMonitoring = (patientId) => {
    if (socket && isConnected && user.role === 'caretaker') {
      socket.emit('join_medication_monitoring', { patientId })
    }
  }

  const clearNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const contextValue = {
    socket,
    isConnected,
    connectionError,
    notifications,
    unreadCount,
    
    // Medication events
    emitMedicationTaken,
    emitMedicationMissed,
    emitMedicationAdded,
    
    // Message events
    sendMessage,
    startTyping,
    stopTyping,
    
    // Caretaker events
    joinPatientMonitoring,
    
    // Notification management
    clearNotifications,
    markNotificationAsRead
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}
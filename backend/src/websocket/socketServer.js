const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

class SocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    })
    
    this.connectedUsers = new Map() // userId -> socketId mapping
    this.userRooms = new Map() // userId -> room mapping
    
    this.setupMiddleware()
    this.setupEventHandlers()
  }

  // Authentication middleware for socket connections
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.id)
        
        if (!user) {
          return next(new Error('Authentication error: User not found'))
        }

        socket.userId = user.id
        socket.user = user
        next()
      } catch (error) {
        console.error('Socket authentication error:', error)
        next(new Error('Authentication error: Invalid token'))
      }
    })
  }

  // Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User ${socket.user.username} connected (Socket: ${socket.id})`)
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id)
      
      // Join user-specific room
      const userRoom = `user_${socket.userId}`
      socket.join(userRoom)
      this.userRooms.set(socket.userId, userRoom)
      
      // Join role-based room
      const roleRoom = `role_${socket.user.role}`
      socket.join(roleRoom)
      
      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to real-time updates',
        userId: socket.userId,
        username: socket.user.username,
        role: socket.user.role
      })

      // Handle medication events
      this.setupMedicationEvents(socket)
      
      // Handle communication events
      this.setupCommunicationEvents(socket)
      
      // Handle notification events
      this.setupNotificationEvents(socket)

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 User ${socket.user.username} disconnected`)
        this.connectedUsers.delete(socket.userId)
        this.userRooms.delete(socket.userId)
      })
    })
  }

  // Medication-related events
  setupMedicationEvents(socket) {
    // Client requests to join medication monitoring
    socket.on('join_medication_monitoring', (data) => {
      const { patientId } = data
      
      // Caretakers can monitor their patients
      if (socket.user.role === 'caretaker') {
        socket.join(`patient_${patientId}`)
        socket.emit('joined_monitoring', { patientId })
      }
    })

    // Medication taken event
    socket.on('medication_taken', (data) => {
      const { medicationId, medicationName, notes } = data
      
      // Broadcast to user's room
      socket.to(`user_${socket.userId}`).emit('medication_updated', {
        type: 'taken',
        medicationId,
        medicationName,
        userId: socket.userId,
        username: socket.user.username,
        notes,
        timestamp: new Date().toISOString()
      })
      
      // Broadcast to caretakers monitoring this patient
      socket.to(`patient_${socket.userId}`).emit('patient_medication_taken', {
        patientId: socket.userId,
        patientName: socket.user.username,
        medicationId,
        medicationName,
        notes,
        timestamp: new Date().toISOString()
      })
    })

    // Medication missed event
    socket.on('medication_missed', (data) => {
      const { medicationId, medicationName, notes } = data
      
      // Broadcast to caretakers monitoring this patient
      socket.to(`patient_${socket.userId}`).emit('patient_medication_missed', {
        patientId: socket.userId,
        patientName: socket.user.username,
        medicationId,
        medicationName,
        notes,
        timestamp: new Date().toISOString(),
        priority: 'high'
      })
    })

    // Medication added event
    socket.on('medication_added', (data) => {
      const { medication } = data
      
      socket.to(`patient_${socket.userId}`).emit('patient_medication_added', {
        patientId: socket.userId,
        patientName: socket.user.username,
        medication,
        timestamp: new Date().toISOString()
      })
    })
  }

  // Communication events
  setupCommunicationEvents(socket) {
    // Send message to specific user
    socket.on('send_message', (data) => {
      const { recipientId, message, type = 'text' } = data
      
      const messageData = {
        senderId: socket.userId,
        senderName: socket.user.username,
        recipientId,
        message,
        type,
        timestamp: new Date().toISOString()
      }
      
      // Send to recipient
      const recipientRoom = `user_${recipientId}`
      socket.to(recipientRoom).emit('new_message', messageData)
      
      // Send confirmation to sender
      socket.emit('message_sent', messageData)
    })

    // Typing indicator
    socket.on('typing_start', (data) => {
      const { recipientId } = data
      socket.to(`user_${recipientId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username
      })
    })

    socket.on('typing_stop', (data) => {
      const { recipientId } = data
      socket.to(`user_${recipientId}`).emit('user_stopped_typing', {
        userId: socket.userId
      })
    })
  }

  // Notification events
  setupNotificationEvents(socket) {
    // Client requests notification subscription
    socket.on('subscribe_notifications', () => {
      socket.join(`notifications_${socket.userId}`)
      socket.emit('notification_subscribed', {
        message: 'Subscribed to notifications'
      })
    })

    // Mark notification as read
    socket.on('mark_notification_read', (data) => {
      const { notificationId } = data
      // Handle notification read status update
      socket.emit('notification_read', { notificationId })
    })
  }

  // Public methods to emit events from other parts of the application
  
  // Emit medication reminder
  emitMedicationReminder(userId, medicationData) {
    const userRoom = `user_${userId}`
    this.io.to(userRoom).emit('medication_reminder', {
      type: 'reminder',
      medication: medicationData,
      timestamp: new Date().toISOString(),
      priority: 'medium'
    })
  }

  // Emit adherence alert
  emitAdherenceAlert(userId, adherenceData) {
    const userRoom = `user_${userId}`
    this.io.to(userRoom).emit('adherence_alert', {
      type: 'adherence_warning',
      data: adherenceData,
      timestamp: new Date().toISOString(),
      priority: 'high'
    })
  }

  // Emit system notification
  emitSystemNotification(userId, notification) {
    const userRoom = `user_${userId}`
    this.io.to(userRoom).emit('system_notification', {
      ...notification,
      timestamp: new Date().toISOString()
    })
  }

  // Broadcast to all users
  broadcastToAll(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    })
  }

  // Broadcast to role
  broadcastToRole(role, event, data) {
    this.io.to(`role_${role}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    })
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId)
  }

  // Get user's socket
  getUserSocket(userId) {
    const socketId = this.connectedUsers.get(userId)
    return socketId ? this.io.sockets.sockets.get(socketId) : null
  }
}

module.exports = SocketServer
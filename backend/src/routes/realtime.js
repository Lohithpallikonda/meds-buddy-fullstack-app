const express = require('express')
const Notification = require('../models/Notification')
const Message = require('../models/Message')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// GET /api/realtime/notifications - Get user notifications
router.get('/notifications', async (req, res) => {
  try {
    const { limit = 20, offset = 0, unread_only = false } = req.query
    
    const notifications = await Notification.findByUserId(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unread_only: unread_only === 'true'
    })
    
    const unreadCount = await Notification.getUnreadCount(req.user.id)
    
    res.json({
      message: 'Notifications retrieved successfully',
      notifications,
      unread_count: unreadCount,
      count: notifications.length
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({
      message: 'Failed to retrieve notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// PUT /api/realtime/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id)
    
    if (isNaN(notificationId)) {
      return res.status(400).json({
        message: 'Invalid notification ID'
      })
    }
    
    // Verify notification belongs to user
    const notification = await Notification.findById(notificationId)
    if (!notification || notification.user_id !== req.user.id) {
      return res.status(404).json({
        message: 'Notification not found'
      })
    }
    
    const updatedNotification = await Notification.markAsRead(notificationId)
    
    res.json({
      message: 'Notification marked as read',
      notification: updatedNotification
    })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// PUT /api/realtime/notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', async (req, res) => {
  try {
    const updatedCount = await Notification.markAllAsRead(req.user.id)
    
    res.json({
      message: 'All notifications marked as read',
      updated_count: updatedCount
    })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    res.status(500).json({
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// DELETE /api/realtime/notifications/:id - Delete notification
router.delete('/notifications/:id', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id)
    
    if (isNaN(notificationId)) {
      return res.status(400).json({
        message: 'Invalid notification ID'
      })
    }
    
    // Verify notification belongs to user
    const notification = await Notification.findById(notificationId)
    if (!notification || notification.user_id !== req.user.id) {
      return res.status(404).json({
        message: 'Notification not found'
      })
    }
    
    const deleted = await Notification.delete(notificationId)
    
    if (!deleted) {
      return res.status(404).json({
        message: 'Notification not found'
      })
    }
    
    res.json({
      message: 'Notification deleted successfully'
    })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// GET /api/realtime/messages - Get user conversations
router.get('/messages', async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user.id)
    
    res.json({
      message: 'Conversations retrieved successfully',
      conversations,
      count: conversations.length
    })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({
      message: 'Failed to retrieve conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// GET /api/realtime/messages/:userId - Get conversation with specific user
router.get('/messages/:userId', async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId)
    const { limit = 50, offset = 0 } = req.query
    
    if (isNaN(otherUserId)) {
      return res.status(400).json({
        message: 'Invalid user ID'
      })
    }
    
    const messages = await Message.getConversation(req.user.id, otherUserId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
    
    res.json({
      message: 'Conversation retrieved successfully',
      messages,
      count: messages.length
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    res.status(500).json({
      message: 'Failed to retrieve conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// POST /api/realtime/messages - Send a message
router.post('/messages', async (req, res) => {
  try {
    const { recipient_id, content, message_type = 'text' } = req.body
    
    if (!recipient_id || !content) {
      return res.status(400).json({
        message: 'Recipient ID and content are required'
      })
    }
    
    if (content.length > 1000) {
      return res.status(400).json({
        message: 'Message content too long (max 1000 characters)'
      })
    }
    
    const message = await Message.create({
      sender_id: req.user.id,
      recipient_id: parseInt(recipient_id),
      content: content.trim(),
      message_type
    })
    
    // Emit real-time event via WebSocket (if socketServer is available)
    if (req.app.locals.socketServer) {
      req.app.locals.socketServer.io.to(`user_${recipient_id}`).emit('new_message', {
        ...message,
        sender_username: req.user.username
      })
    }
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// PUT /api/realtime/messages/:userId/read - Mark conversation as read
router.put('/messages/:userId/read', async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId)
    
    if (isNaN(otherUserId)) {
      return res.status(400).json({
        message: 'Invalid user ID'
      })
    }
    
    const updatedCount = await Message.markConversationAsRead(req.user.id, otherUserId)
    
    res.json({
      message: 'Conversation marked as read',
      updated_count: updatedCount
    })
  } catch (error) {
    console.error('Mark conversation read error:', error)
    res.status(500).json({
      message: 'Failed to mark conversation as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// GET /api/realtime/stats - Get real-time statistics
router.get('/stats', async (req, res) => {
  try {
    const [notificationStats, messageStats] = await Promise.all([
      Notification.getNotificationStats(req.user.id),
      Message.getMessageStats(req.user.id)
    ])
    
    // Get connected users count if socketServer is available
    let connectedUsers = 0
    let isOnline = false
    
    if (req.app.locals.socketServer) {
      connectedUsers = req.app.locals.socketServer.getConnectedUsersCount()
      isOnline = req.app.locals.socketServer.isUserOnline(req.user.id)
    }
    
    res.json({
      message: 'Real-time statistics retrieved successfully',
      stats: {
        notifications: notificationStats,
        messages: messageStats,
        realtime: {
          connected_users: connectedUsers,
          is_online: isOnline,
          last_updated: new Date().toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Get real-time stats error:', error)
    res.status(500).json({
      message: 'Failed to retrieve real-time statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// POST /api/realtime/test-notification - Create test notification (development only)
router.post('/test-notification', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      message: 'Test endpoints only available in development'
    })
  }
  
  try {
    const { type = 'test', title = 'Test Notification', message = 'This is a test notification' } = req.body
    
    const notification = await Notification.create({
      user_id: req.user.id,
      type,
      title,
      message,
      priority: 'medium'
    })
    
    // Emit real-time notification
    if (req.app.locals.socketServer) {
      req.app.locals.socketServer.emitSystemNotification(req.user.id, notification)
    }
    
    res.status(201).json({
      message: 'Test notification created successfully',
      notification
    })
  } catch (error) {
    console.error('Create test notification error:', error)
    res.status(500).json({
      message: 'Failed to create test notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

module.exports = router
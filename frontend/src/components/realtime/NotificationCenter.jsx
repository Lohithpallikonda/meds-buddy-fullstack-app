import { useState, useEffect } from 'react'
import { useWebSocket } from '../../utils/WebSocketContext'
import '../../styles/NotificationCenter.css'

const NotificationCenter = () => {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    clearNotifications,
    markNotificationAsRead 
  } = useWebSocket()
  
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'medication', 'messages'

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.read
    if (filter === 'medication') return ['medication_reminder', 'adherence_alert', 'patient_update'].includes(notification.type)
    if (filter === 'messages') return notification.type === 'new_message'
    return true
  })

  // Get notification icon based on type
  const getNotificationIcon = (type, priority) => {
    switch (type) {
      case 'medication_reminder':
        return '💊'
      case 'adherence_alert':
        return '⚠️'
      case 'patient_update':
        return '👤'
      case 'patient_alert':
        return '🚨'
      case 'new_message':
        return '💬'
      case 'achievement':
        return '🏆'
      case 'system_notification':
        return '🔔'
      default:
        return priority === 'high' ? '🔴' : '🔵'
    }
  }

  // Get notification color based on priority
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#e74c3c'
      case 'medium':
        return '#f39c12'
      case 'low':
        return '#3498db'
      default:
        return '#95a5a6'
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) { // Less than 1 minute
      return 'Just now'
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    } else if (diff < 86400000) { // Less than 24 hours
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id)
    }
    
    // Handle different notification types
    switch (notification.type) {
      case 'medication_reminder':
        // Navigate to today's medications or open medication modal
        console.log('Opening medication reminder:', notification.data)
        break
      case 'new_message':
        // Navigate to messages
        console.log('Opening message:', notification.data)
        break
      default:
        console.log('Notification clicked:', notification)
    }
  }

  return (
    <div className="notification-center">
      {/* Notification Bell Button */}
      <button 
        className={`notification-bell ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
        <span className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {notifications.length > 0 && (
                <button 
                  className="clear-all-btn"
                  onClick={clearNotifications}
                  title="Clear all notifications"
                >
                  Clear All
                </button>
              )}
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
              >
                ×
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="notification-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button 
              className={`filter-btn ${filter === 'medication' ? 'active' : ''}`}
              onClick={() => setFilter('medication')}
            >
              Medication
            </button>
          </div>

          {/* Connection Status */}
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'Real-time updates active' : 'Reconnecting...'}
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                      {!notification.read && <span className="unread-dot"></span>}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTime(notification.timestamp)}
                      </span>
                      <span 
                        className="notification-priority"
                        style={{ color: getPriorityColor(notification.priority) }}
                      >
                        {notification.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <div className="no-notifications-icon">🔔</div>
                <div className="no-notifications-text">
                  {filter === 'all' 
                    ? 'No notifications yet'
                    : filter === 'unread'
                    ? 'No unread notifications'
                    : `No ${filter} notifications`
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="notification-overlay"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  )
}

export default NotificationCenter
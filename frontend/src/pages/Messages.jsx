import { useState, useEffect } from 'react'
import { useAuth } from '../utils/AuthContext'
import { useWebSocket } from '../utils/WebSocketContext'
import NotificationCenter from '../components/realtime/NotificationCenter'
import '../styles/Messages.css'

const Messages = () => {
  const { user, logout } = useAuth()
  const { isConnected, sendMessage } = useWebSocket()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    sendMessage(selectedConversation.other_user_id, newMessage.trim())
    setNewMessage('')
  }

  return (
    <div className="messages-container">
      <header className="messages-header">
        <div className="header-left">
          <h1>Messages</h1>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
        
        <div className="header-actions">
          <NotificationCenter />
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="messages-main">
        <div className="messages-layout">
          {/* Conversations Sidebar */}
          <div className="conversations-sidebar">
            <h3>Conversations</h3>
            {conversations.length > 0 ? (
              <div className="conversations-list">
                {conversations.map(conv => (
                  <div 
                    key={conv.other_user_id}
                    className={`conversation-item ${selectedConversation?.other_user_id === conv.other_user_id ? 'active' : ''}`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="conversation-info">
                      <h4>{conv.other_username}</h4>
                      <p>{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="unread-badge">{conv.unread_count}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-conversations">
                <p>No conversations yet</p>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            {selectedConversation ? (
              <>
                <div className="messages-header">
                  <h3>Chat with {selectedConversation.other_username}</h3>
                </div>
                
                <div className="messages-list">
                  {messages.map(message => (
                    <div 
                      key={message.id}
                      className={`message ${message.sender_id === user.id ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        {message.content}
                      </div>
                      <div className="message-time">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="message-form">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={!isConnected}
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim() || !isConnected}
                    className="btn btn-primary"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="no-conversation-selected">
                <h3>Select a conversation to start messaging</h3>
                <p>Choose a conversation from the sidebar to view messages.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Messages
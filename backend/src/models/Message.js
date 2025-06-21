const { runQuery, getQuery, allQuery } = require('./database')

class Message {
  // Create a new message
  static async create({ sender_id, recipient_id, content, message_type = 'text' }) {
    try {
      const sql = `
        INSERT INTO messages (sender_id, recipient_id, content, message_type)
        VALUES (?, ?, ?, ?)
      `
      
      const result = await runQuery(sql, [sender_id, recipient_id, content, message_type])
      return await Message.findById(result.id)
    } catch (error) {
      throw error
    }
  }

  // Find message by ID
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          m.*,
          s.username as sender_username,
          r.username as recipient_username
        FROM messages m
        JOIN users s ON m.sender_id = s.id
        JOIN users r ON m.recipient_id = r.id
        WHERE m.id = ?
      `
      
      const message = await getQuery(sql, [id])
      return message
    } catch (error) {
      throw error
    }
  }

  // Get conversation between two users
  static async getConversation(user1_id, user2_id, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options
      
      const sql = `
        SELECT 
          m.*,
          s.username as sender_username,
          r.username as recipient_username
        FROM messages m
        JOIN users s ON m.sender_id = s.id
        JOIN users r ON m.recipient_id = r.id
        WHERE (m.sender_id = ? AND m.recipient_id = ?)
           OR (m.sender_id = ? AND m.recipient_id = ?)
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `
      
      const messages = await allQuery(sql, [user1_id, user2_id, user2_id, user1_id, limit, offset])
      return messages.reverse() // Return in chronological order
    } catch (error) {
      throw error
    }
  }

  // Get all conversations for a user
  static async getUserConversations(user_id) {
    try {
      const sql = `
        SELECT DISTINCT
          CASE 
            WHEN m.sender_id = ? THEN m.recipient_id 
            ELSE m.sender_id 
          END as other_user_id,
          CASE 
            WHEN m.sender_id = ? THEN r.username 
            ELSE s.username 
          END as other_username,
          CASE 
            WHEN m.sender_id = ? THEN r.role 
            ELSE s.role 
          END as other_role,
          m.content as last_message,
          m.created_at as last_message_time,
          m.message_type as last_message_type,
          (SELECT COUNT(*) FROM messages 
           WHERE recipient_id = ? AND sender_id = 
           CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END
           AND is_read = 0) as unread_count
        FROM messages m
        JOIN users s ON m.sender_id = s.id
        JOIN users r ON m.recipient_id = r.id
        WHERE m.sender_id = ? OR m.recipient_id = ?
        GROUP BY other_user_id
        ORDER BY m.created_at DESC
      `
      
      const conversations = await allQuery(sql, [
        user_id, user_id, user_id, user_id, user_id, user_id, user_id
      ])
      
      return conversations
    } catch (error) {
      throw error
    }
  }

  // Mark message as read
  static async markAsRead(id) {
    try {
      const sql = `
        UPDATE messages 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `
      
      await runQuery(sql, [id])
      return await Message.findById(id)
    } catch (error) {
      throw error
    }
  }

  // Mark all messages in conversation as read
  static async markConversationAsRead(user_id, other_user_id) {
    try {
      const sql = `
        UPDATE messages 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP 
        WHERE recipient_id = ? AND sender_id = ? AND is_read = 0
      `
      
      const result = await runQuery(sql, [user_id, other_user_id])
      return result.changes
    } catch (error) {
      throw error
    }
  }

  // Get unread message count for user
  static async getUnreadCount(user_id) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_read = 0'
      const result = await getQuery(sql, [user_id])
      return result.count
    } catch (error) {
      throw error
    }
  }

  // Delete message
  static async delete(id) {
    try {
      const sql = 'DELETE FROM messages WHERE id = ?'
      const result = await runQuery(sql, [id])
      return result.changes > 0
    } catch (error) {
      throw error
    }
  }

  // Search messages
  static async searchMessages(user_id, searchTerm, options = {}) {
    try {
      const { limit = 20 } = options
      
      const sql = `
        SELECT 
          m.*,
          s.username as sender_username,
          r.username as recipient_username
        FROM messages m
        JOIN users s ON m.sender_id = s.id
        JOIN users r ON m.recipient_id = r.id
        WHERE (m.sender_id = ? OR m.recipient_id = ?)
          AND m.content LIKE ?
        ORDER BY m.created_at DESC
        LIMIT ?
      `
      
      const messages = await allQuery(sql, [user_id, user_id, `%${searchTerm}%`, limit])
      return messages
    } catch (error) {
      throw error
    }
  }

  // Get message statistics
  static async getMessageStats(user_id) {
    try {
      const totalSentSql = 'SELECT COUNT(*) as total FROM messages WHERE sender_id = ?'
      const totalReceivedSql = 'SELECT COUNT(*) as total FROM messages WHERE recipient_id = ?'
      const unreadSql = 'SELECT COUNT(*) as unread FROM messages WHERE recipient_id = ? AND is_read = 0'
      const todaySql = `
        SELECT COUNT(*) as today 
        FROM messages 
        WHERE (sender_id = ? OR recipient_id = ?) 
          AND date(created_at) = date('now')
      `
      
      const [sent, received, unread, today] = await Promise.all([
        getQuery(totalSentSql, [user_id]),
        getQuery(totalReceivedSql, [user_id]),
        getQuery(unreadSql, [user_id]),
        getQuery(todaySql, [user_id, user_id])
      ])
      
      return {
        total_sent: sent.total,
        total_received: received.total,
        unread: unread.unread,
        today: today.today
      }
    } catch (error) {
      throw error
    }
  }
}

module.exports = Message
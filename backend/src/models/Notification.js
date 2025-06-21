const { runQuery, getQuery, allQuery } = require('./database')

class Notification {
  // Create a new notification
  static async create({ user_id, type, title, message, data = null, priority = 'medium' }) {
    try {
      const sql = `
        INSERT INTO notifications (user_id, type, title, message, data, priority)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      
      const result = await runQuery(sql, [
        user_id, 
        type, 
        title, 
        message, 
        data ? JSON.stringify(data) : null, 
        priority
      ])
      
      return await Notification.findById(result.id)
    } catch (error) {
      throw error
    }
  }

  // Find notification by ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM notifications WHERE id = ?'
      const notification = await getQuery(sql, [id])
      
      if (notification && notification.data) {
        notification.data = JSON.parse(notification.data)
      }
      
      return notification
    } catch (error) {
      throw error
    }
  }

  // Get notifications for a user
  static async findByUserId(user_id, options = {}) {
    try {
      const { limit = 50, offset = 0, unread_only = false } = options
      
      let sql = `
        SELECT * FROM notifications 
        WHERE user_id = ?
      `
      const params = [user_id]
      
      if (unread_only) {
        sql += ' AND is_read = 0'
      }
      
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      params.push(limit, offset)
      
      const notifications = await allQuery(sql, params)
      
      // Parse JSON data for each notification
      return notifications.map(notification => {
        if (notification.data) {
          notification.data = JSON.parse(notification.data)
        }
        return notification
      })
    } catch (error) {
      throw error
    }
  }

  // Mark notification as read
  static async markAsRead(id) {
    try {
      const sql = `
        UPDATE notifications 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `
      
      await runQuery(sql, [id])
      return await Notification.findById(id)
    } catch (error) {
      throw error
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(user_id) {
    try {
      const sql = `
        UPDATE notifications 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP 
        WHERE user_id = ? AND is_read = 0
      `
      
      const result = await runQuery(sql, [user_id])
      return result.changes
    } catch (error) {
      throw error
    }
  }

  // Get unread count for user
  static async getUnreadCount(user_id) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
      const result = await getQuery(sql, [user_id])
      return result.count
    } catch (error) {
      throw error
    }
  }

  // Delete notification
  static async delete(id) {
    try {
      const sql = 'DELETE FROM notifications WHERE id = ?'
      const result = await runQuery(sql, [id])
      return result.changes > 0
    } catch (error) {
      throw error
    }
  }

  // Delete old notifications (cleanup)
  static async deleteOldNotifications(days = 30) {
    try {
      const sql = `
        DELETE FROM notifications 
        WHERE created_at < datetime('now', '-${days} days')
      `
      
      const result = await runQuery(sql)
      return result.changes
    } catch (error) {
      throw error
    }
  }

  // Create medication reminder notification
  static async createMedicationReminder(user_id, medication) {
    return await Notification.create({
      user_id,
      type: 'medication_reminder',
      title: 'Medication Reminder',
      message: `Time to take your ${medication.name} (${medication.dosage})`,
      data: {
        medication_id: medication.id,
        medication_name: medication.name,
        medication_dosage: medication.dosage
      },
      priority: 'high'
    })
  }

  // Create adherence alert notification
  static async createAdherenceAlert(user_id, adherenceData) {
    return await Notification.create({
      user_id,
      type: 'adherence_alert',
      title: 'Adherence Alert',
      message: `Your medication adherence has dropped to ${adherenceData.adherence_rate}%`,
      data: adherenceData,
      priority: 'high'
    })
  }

  // Create streak achievement notification
  static async createStreakAchievement(user_id, streak) {
    return await Notification.create({
      user_id,
      type: 'achievement',
      title: 'Great Job!',
      message: `You've maintained your medication routine for ${streak} days in a row!`,
      data: { streak },
      priority: 'medium'
    })
  }

  // Create medication missed notification
  static async createMedicationMissed(user_id, medication) {
    return await Notification.create({
      user_id,
      type: 'medication_missed',
      title: 'Missed Medication',
      message: `You missed your ${medication.name} dose`,
      data: {
        medication_id: medication.id,
        medication_name: medication.name
      },
      priority: 'high'
    })
  }

  // Create caretaker alert
  static async createCaretakerAlert(caretaker_id, patient_name, message, data = null) {
    return await Notification.create({
      user_id: caretaker_id,
      type: 'caretaker_alert',
      title: 'Patient Alert',
      message: `${patient_name}: ${message}`,
      data,
      priority: 'high'
    })
  }

  // Get notification stats
  static async getNotificationStats(user_id) {
    try {
      const totalSql = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?'
      const unreadSql = 'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0'
      const todaySql = `
        SELECT COUNT(*) as today 
        FROM notifications 
        WHERE user_id = ? AND date(created_at) = date('now')
      `
      
      const [total, unread, today] = await Promise.all([
        getQuery(totalSql, [user_id]),
        getQuery(unreadSql, [user_id]),
        getQuery(todaySql, [user_id])
      ])
      
      return {
        total: total.total,
        unread: unread.unread,
        today: today.today
      }
    } catch (error) {
      throw error
    }
  }
}

module.exports = Notification
const { runQuery, getQuery, allQuery } = require('./database')

class Medication {
  // Create a new medication
  static async create({ user_id, name, dosage, frequency }) {
    try {
      const sql = `
        INSERT INTO medications (user_id, name, dosage, frequency)
        VALUES (?, ?, ?, ?)
      `
      
      const result = await runQuery(sql, [user_id, name, dosage, frequency])
      return await Medication.findById(result.id)
    } catch (error) {
      throw error
    }
  }

  // Find medication by ID
  static async findById(id) {
    try {
      const sql = `
        SELECT m.*, u.username 
        FROM medications m 
        JOIN users u ON m.user_id = u.id 
        WHERE m.id = ?
      `
      const medication = await getQuery(sql, [id])
      return medication
    } catch (error) {
      throw error
    }
  }

  // Find all medications for a user
  static async findByUserId(user_id) {
    try {
      const sql = `
        SELECT * FROM medications 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `
      const medications = await allQuery(sql, [user_id])
      return medications
    } catch (error) {
      throw error
    }
  }

  // Update medication
  static async update(id, updates) {
    try {
      const fields = []
      const values = []

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'id' && key !== 'user_id') {
          fields.push(`${key} = ?`)
          values.push(updates[key])
        }
      })

      if (fields.length === 0) {
        throw new Error('No fields to update')
      }

      values.push(new Date().toISOString())
      values.push(id)

      const sql = `
        UPDATE medications 
        SET ${fields.join(', ')}, updated_at = ?
        WHERE id = ?
      `

      await runQuery(sql, values)
      return await Medication.findById(id)
    } catch (error) {
      throw error
    }
  }

  // Delete medication
  static async delete(id) {
    try {
      const sql = 'DELETE FROM medications WHERE id = ?'
      const result = await runQuery(sql, [id])
      return result.changes > 0
    } catch (error) {
      throw error
    }
  }

  // Check if medication belongs to user
  static async belongsToUser(medicationId, userId) {
    try {
      const sql = 'SELECT user_id FROM medications WHERE id = ?'
      const medication = await getQuery(sql, [medicationId])
      return medication && medication.user_id === userId
    } catch (error) {
      throw error
    }
  }

  // Get medications with today's status
  static async getTodaysMedications(user_id) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const sql = `
        SELECT 
          m.*,
          ml.id as log_id,
          ml.status,
          ml.taken_date,
          ml.notes
        FROM medications m
        LEFT JOIN medication_logs ml ON m.id = ml.medication_id 
          AND ml.taken_date = ?
        WHERE m.user_id = ?
        ORDER BY m.created_at DESC
      `
      
      const medications = await allQuery(sql, [today, user_id])
      return medications
    } catch (error) {
      throw error
    }
  }

  // Get medication counts for dashboard
  static async getMedicationStats(user_id) {
    try {
      const totalSql = 'SELECT COUNT(*) as total FROM medications WHERE user_id = ?'
      const totalResult = await getQuery(totalSql, [user_id])
      
      const today = new Date().toISOString().split('T')[0]
      const todayTakenSql = `
        SELECT COUNT(*) as taken_today
        FROM medications m
        JOIN medication_logs ml ON m.id = ml.medication_id
        WHERE m.user_id = ? AND ml.taken_date = ? AND ml.status = 'taken'
      `
      const todayTakenResult = await getQuery(todayTakenSql, [user_id, today])
      
      return {
        total_medications: totalResult.total,
        taken_today: todayTakenResult.taken_today || 0,
        pending_today: Math.max(0, totalResult.total - (todayTakenResult.taken_today || 0))
      }
    } catch (error) {
      throw error
    }
  }
}

module.exports = Medication
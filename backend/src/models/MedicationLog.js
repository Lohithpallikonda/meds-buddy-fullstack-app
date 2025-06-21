const { runQuery, getQuery, allQuery } = require('./database')

class MedicationLog {
  // Create a new medication log entry
  static async create({ medication_id, taken_date, status = 'taken', notes = null }) {
    try {
      const sql = `
        INSERT INTO medication_logs (medication_id, taken_date, status, notes)
        VALUES (?, ?, ?, ?)
      `
      
      const result = await runQuery(sql, [medication_id, taken_date, status, notes])
      return await MedicationLog.findById(result.id)
    } catch (error) {
      throw error
    }
  }

  // Find log by ID
  static async findById(id) {
    try {
      const sql = `
        SELECT ml.*, m.name as medication_name, m.dosage, m.frequency
        FROM medication_logs ml
        JOIN medications m ON ml.medication_id = m.id
        WHERE ml.id = ?
      `
      const log = await getQuery(sql, [id])
      return log
    } catch (error) {
      throw error
    }
  }

  // Find existing log for medication on specific date
  static async findByMedicationAndDate(medication_id, taken_date) {
    try {
      const sql = `
        SELECT * FROM medication_logs 
        WHERE medication_id = ? AND taken_date = ?
      `
      const log = await getQuery(sql, [medication_id, taken_date])
      return log
    } catch (error) {
      throw error
    }
  }

  // Update existing log
  static async update(id, updates) {
    try {
      const fields = []
      const values = []

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'id') {
          fields.push(`${key} = ?`)
          values.push(updates[key])
        }
      })

      if (fields.length === 0) {
        throw new Error('No fields to update')
      }

      values.push(id)

      const sql = `
        UPDATE medication_logs 
        SET ${fields.join(', ')}
        WHERE id = ?
      `

      await runQuery(sql, values)
      return await MedicationLog.findById(id)
    } catch (error) {
      throw error
    }
  }

  // Mark medication as taken for today
  static async markAsTaken(medication_id, notes = null) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Check if already logged today
      const existingLog = await MedicationLog.findByMedicationAndDate(medication_id, today)
      
      if (existingLog) {
        // Update existing log
        return await MedicationLog.update(existingLog.id, {
          status: 'taken',
          notes: notes
        })
      } else {
        // Create new log
        return await MedicationLog.create({
          medication_id,
          taken_date: today,
          status: 'taken',
          notes: notes
        })
      }
    } catch (error) {
      throw error
    }
  }

  // Mark medication as missed
  static async markAsMissed(medication_id, notes = null) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const existingLog = await MedicationLog.findByMedicationAndDate(medication_id, today)
      
      if (existingLog) {
        return await MedicationLog.update(existingLog.id, {
          status: 'missed',
          notes: notes
        })
      } else {
        return await MedicationLog.create({
          medication_id,
          taken_date: today,
          status: 'missed',
          notes: notes
        })
      }
    } catch (error) {
      throw error
    }
  }

  // Get user's medication logs for a date range
  static async getUserLogs(user_id, start_date, end_date) {
    try {
      const sql = `
        SELECT 
          ml.*,
          m.name as medication_name,
          m.dosage,
          m.frequency
        FROM medication_logs ml
        JOIN medications m ON ml.medication_id = m.id
        WHERE m.user_id = ? 
          AND ml.taken_date >= ? 
          AND ml.taken_date <= ?
        ORDER BY ml.taken_date DESC, ml.created_at DESC
      `
      
      const logs = await allQuery(sql, [user_id, start_date, end_date])
      return logs
    } catch (error) {
      throw error
    }
  }

  // Calculate adherence rate for user
  static async calculateAdherence(user_id, days = 30) {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      
      // Get total expected doses (medications * days)
      const expectedSql = `
        SELECT COUNT(*) * ? as expected_doses
        FROM medications 
        WHERE user_id = ? 
          AND created_at <= ?
      `
      const expectedResult = await getQuery(expectedSql, [days, user_id, endDate])
      
      // Get actual taken doses
      const takenSql = `
        SELECT COUNT(*) as taken_doses
        FROM medication_logs ml
        JOIN medications m ON ml.medication_id = m.id
        WHERE m.user_id = ? 
          AND ml.taken_date >= ? 
          AND ml.taken_date <= ?
          AND ml.status = 'taken'
      `
      const takenResult = await getQuery(takenSql, [user_id, startDate, endDate])
      
      const expected = expectedResult.expected_doses || 0
      const taken = takenResult.taken_doses || 0
      
      const adherenceRate = expected > 0 ? Math.round((taken / expected) * 100) : 0
      
      return {
        adherence_rate: adherenceRate,
        expected_doses: expected,
        taken_doses: taken,
        missed_doses: expected - taken,
        period_days: days
      }
    } catch (error) {
      throw error
    }
  }

  // Get medication streak (consecutive days of taking all medications)
  static async getMedicationStreak(user_id) {
    try {
      let streak = 0
      const today = new Date()
      
      // Start from yesterday and go backwards
      for (let i = 1; i <= 365; i++) {
        const checkDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000))
        const dateStr = checkDate.toISOString().split('T')[0]
        
        // Get medications that existed on this date
        const medicationsSql = `
          SELECT COUNT(*) as total_meds
          FROM medications 
          WHERE user_id = ? AND created_at <= ?
        `
        const medsResult = await getQuery(medicationsSql, [user_id, dateStr + 'T23:59:59'])
        
        // Get medications taken on this date
        const takenSql = `
          SELECT COUNT(*) as taken_meds
          FROM medication_logs ml
          JOIN medications m ON ml.medication_id = m.id
          WHERE m.user_id = ? 
            AND ml.taken_date = ?
            AND ml.status = 'taken'
        `
        const takenResult = await getQuery(takenSql, [user_id, dateStr])
        
        const totalMeds = medsResult.total_meds || 0
        const takenMeds = takenResult.taken_meds || 0
        
        // If no medications existed that day, skip
        if (totalMeds === 0) {
          continue
        }
        
        // If all medications were taken, increment streak
        if (takenMeds === totalMeds) {
          streak++
        } else {
          // Streak broken
          break
        }
      }
      
      return streak
    } catch (error) {
      throw error
    }
  }

  // Get recent activity logs
  static async getRecentActivity(user_id, limit = 10) {
    try {
      const sql = `
        SELECT 
          ml.*,
          m.name as medication_name,
          m.dosage
        FROM medication_logs ml
        JOIN medications m ON ml.medication_id = m.id
        WHERE m.user_id = ?
        ORDER BY ml.created_at DESC
        LIMIT ?
      `
      
      const logs = await allQuery(sql, [user_id, limit])
      return logs
    } catch (error) {
      throw error
    }
  }

  // Delete log
  static async delete(id) {
    try {
      const sql = 'DELETE FROM medication_logs WHERE id = ?'
      const result = await runQuery(sql, [id])
      return result.changes > 0
    } catch (error) {
      throw error
    }
  }
}

module.exports = MedicationLog
const bcrypt = require('bcryptjs')
const { runQuery, getQuery } = require('./database')

class User {
  // Create a new user
  static async create({ username, email, password, role = 'patient' }) {
    try {
      // Hash password
      const saltRounds = 10
      const password_hash = await bcrypt.hash(password, saltRounds)

      const sql = `
        INSERT INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `
      
      const result = await runQuery(sql, [username, email, password_hash, role])
      return { id: result.id, username, email, role }
    } catch (error) {
      throw error
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = ?'
      const user = await getQuery(sql, [email])
      return user
    } catch (error) {
      throw error
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const sql = 'SELECT id, username, email, role, created_at FROM users WHERE id = ?'
      const user = await getQuery(sql, [id])
      return user
    } catch (error) {
      throw error
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const sql = 'SELECT * FROM users WHERE username = ?'
      const user = await getQuery(sql, [username])
      return user
    } catch (error) {
      throw error
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword)
    } catch (error) {
      throw error
    }
  }

  // Update user information
  static async update(id, updates) {
    try {
      const fields = []
      const values = []

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
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
        UPDATE users 
        SET ${fields.join(', ')}, updated_at = ?
        WHERE id = ?
      `

      await runQuery(sql, values)
      return await User.findById(id)
    } catch (error) {
      throw error
    }
  }

  // Delete user
  static async delete(id) {
    try {
      const sql = 'DELETE FROM users WHERE id = ?'
      const result = await runQuery(sql, [id])
      return result.changes > 0
    } catch (error) {
      throw error
    }
  }
}

module.exports = User
const express = require('express')
const User = require('../models/User')
const { generateToken, authenticateToken } = require('../middleware/auth')
const { validateRegistration, validateLogin, sanitizeInput } = require('../utils/validation')

const router = express.Router()

// Register new user
router.post('/register', async (req, res) => {
  try {
    // Sanitize input
    const userData = {
      username: sanitizeInput(req.body.username),
      email: sanitizeInput(req.body.email),
      password: req.body.password, // Don't sanitize password
      role: sanitizeInput(req.body.role) || 'patient'
    }

    // Validate input
    const validation = validateRegistration(userData)
    if (!validation.isValid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors
      })
    }

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(userData.email)
    if (existingUserByEmail) {
      return res.status(409).json({
        message: 'User with this email already exists'
      })
    }

    const existingUserByUsername = await User.findByUsername(userData.username)
    if (existingUserByUsername) {
      return res.status(409).json({
        message: 'Username is already taken'
      })
    }

    // Create new user
    const newUser = await User.create(userData)

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// Login user
router.post('/login', async (req, res) => {
  try {
    // Sanitize input
    const loginData = {
      email: sanitizeInput(req.body.email),
      password: req.body.password // Don't sanitize password
    }

    // Validate input
    const validation = validateLogin(loginData)
    if (!validation.isValid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors
      })
    }

    // Find user
    const user = await User.findByEmail(loginData.email)
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(loginData.password, user.password_hash)
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    // Generate token
    const token = generateToken(user.id)

    // Return user data and token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// Get user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'Profile retrieved successfully',
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        created_at: req.user.created_at
      }
    })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({
      message: 'Failed to retrieve profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// Update user profile (protected route)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = ['username', 'email']
    const updates = {}

    // Only allow specific fields to be updated
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = sanitizeInput(req.body[field])
      }
    })

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid fields to update'
      })
    }

    // Check for duplicate email or username
    if (updates.email) {
      const existingUser = await User.findByEmail(updates.email)
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({
          message: 'Email is already taken'
        })
      }
    }

    if (updates.username) {
      const existingUser = await User.findByUsername(updates.username)
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({
          message: 'Username is already taken'
        })
      }
    }

    // Update user
    const updatedUser = await User.update(req.user.id, updates)

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

module.exports = router
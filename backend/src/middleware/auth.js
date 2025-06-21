const jwt = require('jsonwebtoken')
const User = require('../models/User')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    } else {
      console.error('Auth middleware error:', error)
      return res.status(500).json({ message: 'Server error' })
    }
  }
}

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  )
}

module.exports = {
  authenticateToken,
  generateToken
}
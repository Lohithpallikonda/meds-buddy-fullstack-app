// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation
const isValidPassword = (password) => {
  return password && password.length >= 6
}

// Username validation
const isValidUsername = (username) => {
  return username && username.length >= 3 && username.length <= 30
}

// Sanitize input to prevent SQL injection
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  // Remove potentially dangerous characters
  return input.replace(/[<>\"'%;()&+]/g, '')
}

// Validate registration data
const validateRegistration = (userData) => {
  const errors = {}
  
  if (!userData.username || !isValidUsername(userData.username)) {
    errors.username = 'Username must be between 3 and 30 characters'
  }
  
  if (!userData.email || !isValidEmail(userData.email)) {
    errors.email = 'Please provide a valid email address'
  }
  
  if (!userData.password || !isValidPassword(userData.password)) {
    errors.password = 'Password must be at least 6 characters long'
  }
  
  if (userData.role && !['patient', 'caretaker'].includes(userData.role)) {
    errors.role = 'Role must be either patient or caretaker'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validate login data
const validateLogin = (userData) => {
  const errors = {}
  
  if (!userData.email || !isValidEmail(userData.email)) {
    errors.email = 'Please provide a valid email address'
  }
  
  if (!userData.password) {
    errors.password = 'Password is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  sanitizeInput,
  validateRegistration,
  validateLogin
}
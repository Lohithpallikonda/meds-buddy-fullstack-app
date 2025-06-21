const { sanitizeInput } = require('./validation')

// Validate medication name
const isValidMedicationName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 100
}

// Validate dosage
const isValidDosage = (dosage) => {
  return dosage && dosage.trim().length >= 1 && dosage.trim().length <= 50
}

// Validate frequency
const isValidFrequency = (frequency) => {
  const validFrequencies = [
    'once_daily',
    'twice_daily', 
    'three_times_daily',
    'four_times_daily',
    'every_6_hours',
    'every_8_hours',
    'every_12_hours',
    'as_needed',
    'weekly',
    'monthly',
    'custom'
  ]
  return frequency && validFrequencies.includes(frequency)
}

// Get frequency display text
const getFrequencyDisplay = (frequency) => {
  const frequencyMap = {
    'once_daily': 'Once a day',
    'twice_daily': 'Twice a day',
    'three_times_daily': 'Three times a day',
    'four_times_daily': 'Four times a day',
    'every_6_hours': 'Every 6 hours',
    'every_8_hours': 'Every 8 hours',
    'every_12_hours': 'Every 12 hours',
    'as_needed': 'As needed',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'custom': 'Custom schedule'
  }
  return frequencyMap[frequency] || frequency
}

// Validate medication creation data
const validateMedicationData = (medicationData) => {
  const errors = {}
  
  if (!medicationData.name || !isValidMedicationName(medicationData.name)) {
    errors.name = 'Medication name must be between 2 and 100 characters'
  }
  
  if (!medicationData.dosage || !isValidDosage(medicationData.dosage)) {
    errors.dosage = 'Dosage is required and must be between 1 and 50 characters'
  }
  
  if (!medicationData.frequency || !isValidFrequency(medicationData.frequency)) {
    errors.frequency = 'Please select a valid frequency'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Sanitize medication data
const sanitizeMedicationData = (data) => {
  return {
    name: sanitizeInput(data.name?.trim()),
    dosage: sanitizeInput(data.dosage?.trim()),
    frequency: data.frequency // Don't sanitize frequency as it's from a controlled list
  }
}

// Validate medication log data
const validateLogData = (logData) => {
  const errors = {}
  
  if (!logData.medication_id || isNaN(parseInt(logData.medication_id))) {
    errors.medication_id = 'Valid medication ID is required'
  }
  
  if (logData.status && !['taken', 'missed', 'skipped'].includes(logData.status)) {
    errors.status = 'Status must be taken, missed, or skipped'
  }
  
  if (logData.notes && logData.notes.length > 500) {
    errors.notes = 'Notes must be less than 500 characters'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validate date format (YYYY-MM-DD)
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const date = new Date(dateString)
  const timestamp = date.getTime()
  
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) return false
  
  return dateString === date.toISOString().split('T')[0]
}

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]
}

// Get date range for queries
const getDateRange = (days = 30) => {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))
  
  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0]
  }
}

// Format medication for response
const formatMedicationResponse = (medication) => {
  if (!medication) return null
  
  return {
    id: medication.id,
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    frequency_display: getFrequencyDisplay(medication.frequency),
    created_at: medication.created_at,
    updated_at: medication.updated_at,
    // Include log data if present
    ...(medication.log_id && {
      today_log: {
        id: medication.log_id,
        status: medication.status,
        taken_date: medication.taken_date,
        notes: medication.notes
      }
    })
  }
}

// Format log for response
const formatLogResponse = (log) => {
  if (!log) return null
  
  return {
    id: log.id,
    medication_id: log.medication_id,
    medication_name: log.medication_name,
    dosage: log.dosage,
    frequency: log.frequency,
    taken_date: log.taken_date,
    status: log.status,
    notes: log.notes,
    created_at: log.created_at
  }
}

module.exports = {
  isValidMedicationName,
  isValidDosage,
  isValidFrequency,
  getFrequencyDisplay,
  validateMedicationData,
  sanitizeMedicationData,
  validateLogData,
  isValidDate,
  getTodayDate,
  getDateRange,
  formatMedicationResponse,
  formatLogResponse
}
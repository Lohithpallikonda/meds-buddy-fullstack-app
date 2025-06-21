import axios from 'axios'

export const medicationApi = {
  getMedications: async () => {
    const response = await axios.get('/api/medications')
    return response.data
  },
  getTodaysMedications: async () => {
    const response = await axios.get('/api/medications/today')
    return response.data
  },
  getMedicationStats: async () => {
    const response = await axios.get('/api/medications/stats')
    return response.data
  },
  createMedication: async (medicationData) => {
    const response = await axios.post('/api/medications', medicationData)
    return response.data
  },
  getMedication: async (id) => {
    const response = await axios.get(`/api/medications/${id}`)
    return response.data
  },
  updateMedication: async (id, medicationData) => {
    const response = await axios.put(`/api/medications/${id}`, medicationData)
    return response.data
  },
  deleteMedication: async (id) => {
    const response = await axios.delete(`/api/medications/${id}`)
    return response.data
  },
  markAsTaken: async (id, notes = null) => {
    const response = await axios.post(`/api/medications/${id}/take`, { notes })
    return response.data
  },
  markAsMissed: async (id, notes = null) => {
    const response = await axios.post(`/api/medications/${id}/miss`, { notes })
    return response.data
  },
  getMedicationLogs: async (params = {}) => {
    const response = await axios.get('/api/medications/logs/history', { params })
    return response.data
  },
  uploadProof: async (logId, formData) => {
    const response = await axios.post(`/api/medications/${logId}/upload-proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}

export const validateMedicationForm = (data) => {
  const errors = {}
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Medication name must be at least 2 characters'
  }
  if (!data.dosage || data.dosage.trim().length < 1) {
    errors.dosage = 'Dosage is required'
  }
  if (!data.frequency) {
    errors.frequency = 'Frequency is required'
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const frequencyOptions = [
  { value: 'once_daily', label: 'Once a day' },
  { value: 'twice_daily', label: 'Twice a day' },
  { value: 'three_times_daily', label: 'Three times a day' },
  { value: 'four_times_daily', label: 'Four times a day' },
  { value: 'every_6_hours', label: 'Every 6 hours' },
  { value: 'every_8_hours', label: 'Every 8 hours' },
  { value: 'every_12_hours', label: 'Every 12 hours' },
  { value: 'as_needed', label: 'As needed' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom schedule' }
]

export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getStatusColor = (status) => {
  switch (status) {
    case 'taken':
      return '#28a745'
    case 'missed':
      return '#dc3545'
    case 'skipped':
      return '#ffc107'
    default:
      return '#6c757d'
  }
}

export const getStatusDisplay = (status) => {
  switch (status) {
    case 'taken':
      return 'Taken'
    case 'missed':
      return 'Missed'
    case 'skipped':
      return 'Skipped'
    default:
      return 'Unknown'
  }
}
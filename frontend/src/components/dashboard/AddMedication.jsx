import { useState } from 'react'
import { useCreateMedication } from '../../hooks/useMedications'
import { validateMedicationForm, frequencyOptions } from '../../utils/medicationApi'
import '../../styles/AddMedication.css'

const AddMedication = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: ''
  })
  const [errors, setErrors] = useState({})
  
  const createMedication = useCreateMedication()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    const validation = validateMedicationForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }
    
    try {
      await createMedication.mutateAsync(formData)
      setFormData({ name: '', dosage: '', frequency: '' })
      setErrors({})
      onSuccess?.()
      onClose?.()
    } catch (error) {
      setErrors({ 
        submit: error.response?.data?.message || 'Failed to create medication' 
      })
    }
  }

  return (
    <div className="add-medication-overlay">
      <div className="add-medication-modal">
        <div className="modal-header">
          <h3>Add New Medication</h3>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-medication-form">
          <div className="form-group">
            <label htmlFor="name">Medication Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="e.g., Ibuprofen, Vitamin D, etc."
              disabled={createMedication.isPending}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="dosage">Dosage *</label>
            <input
              type="text"
              id="dosage"
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              className={errors.dosage ? 'error' : ''}
              placeholder="e.g., 200mg, 1 tablet, 5ml, etc."
              disabled={createMedication.isPending}
            />
            {errors.dosage && <span className="error-message">{errors.dosage}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="frequency">Frequency *</label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className={errors.frequency ? 'error' : ''}
              disabled={createMedication.isPending}
            >
              <option value="">Select frequency</option>
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.frequency && <span className="error-message">{errors.frequency}</span>}
          </div>

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={createMedication.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMedication.isPending}
            >
              {createMedication.isPending ? 'Adding...' : 'Add Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMedication
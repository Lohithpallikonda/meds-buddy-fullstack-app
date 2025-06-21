import { useState } from 'react'
import { useMarkAsTaken, useMarkAsMissed, useDeleteMedication, useUploadProof } from '../../hooks/useMedications'
import { getStatusColor, getStatusDisplay } from '../../utils/medicationApi'
import '../../styles/MedicationCard.css'

const MedicationCard = ({ medication, showActions = true, onEdit }) => {
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [proofImage, setProofImage] = useState(null)
  const [actionType, setActionType] = useState(null)

  const markAsTaken = useMarkAsTaken()
  const markAsMissed = useMarkAsMissed()
  const deleteMedication = useDeleteMedication()
  const uploadProof = useUploadProof()

  const isTakenToday = medication.today_log?.status === 'taken'
  const isMissedToday = medication.today_log?.status === 'missed'
  const hasLogToday = !!medication.today_log

  const handleMarkAsTaken = async () => {
    try {
      const result = await markAsTaken.mutateAsync({ id: medication.id, notes: notes || null })
      const logId = result?.log?.id;

      if (proofImage && logId) {
        const formData = new FormData();
        formData.append('proofImage', proofImage);
        await uploadProof.mutateAsync({ logId, formData });
      }

      setNotes('')
      setProofImage(null)
      setShowNotes(false)
      setActionType(null)
    } catch (error) {
      console.error('Failed to mark as taken:', error)
    }
  }

  const handleMarkAsMissed = async () => {
    try {
      await markAsMissed.mutateAsync({ id: medication.id, notes: notes || null })
      setNotes('')
      setShowNotes(false)
      setActionType(null)
    } catch (error) {
      console.error('Failed to mark as missed:', error)
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${medication.name}"?`)) {
      try {
        await deleteMedication.mutateAsync(medication.id)
      } catch (error) {
        console.error('Failed to delete medication:', error)
      }
    }
  }

  const showNotesDialog = (type) => {
    setActionType(type)
    setShowNotes(true)
  }

  const cancelNotes = () => {
    setShowNotes(false)
    setNotes('')
    setProofImage(null)
    setActionType(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setProofImage(file);
    } else {
      setProofImage(null);
    }
  }

  const submitAction = () => {
    if (actionType === 'take') {
      handleMarkAsTaken()
    } else if (actionType === 'miss') {
      handleMarkAsMissed()
    }
  }

  return (
    <div className="medication-card">
      <div className="medication-header">
        <div className="medication-info">
          <h4 className="medication-name">{medication.name}</h4>
          <p className="medication-details">
            <span className="dosage">{medication.dosage}</span>
            <span className="frequency">{medication.frequency_display}</span>
          </p>
        </div>
        {hasLogToday && (
          <div
            className="status-badge"
            style={{ backgroundColor: getStatusColor(medication.today_log.status) }}
          >
            {getStatusDisplay(medication.today_log.status)}
          </div>
        )}
      </div>

      {medication.today_log?.proof_image_path && (
        <div className="medication-proof">
          <small><strong>Proof:</strong></small>
          <a href={medication.today_log.proof_image_path} target="_blank" rel="noopener noreferrer">
            <img src={medication.today_log.proof_image_path} alt={`Proof for ${medication.name}`} className="proof-thumbnail" />
          </a>
        </div>
      )}

      {medication.today_log?.notes && (
        <div className="medication-notes">
          <small><strong>Notes:</strong> {medication.today_log.notes}</small>
        </div>
      )}

      {showActions && (
        <div className="medication-actions">
          {!isTakenToday && (
            <button
              className="btn btn-success btn-sm"
              onClick={() => showNotesDialog('take')}
              disabled={markAsTaken.isPending}
            >
              {markAsTaken.isPending ? 'Marking...' : 'Mark as Taken'}
            </button>
          )}
          {!isMissedToday && !isTakenToday && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => showNotesDialog('miss')}
              disabled={markAsMissed.isPending}
            >
              {markAsMissed.isPending ? 'Marking...' : 'Mark as Missed'}
            </button>
          )}
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onEdit?.(medication)}
          >
            Edit
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={deleteMedication.isPending}
          >
            {deleteMedication.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}

      {showNotes && (
        <div className="notes-overlay">
          <div className="notes-modal">
            <h4>
              {actionType === 'take' ? 'Mark as Taken' : 'Mark as Missed'}
            </h4>
            <p>Add any notes about this medication (optional):</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (optional)..."
              rows="3"
              maxLength="500"
            />

            {actionType === 'take' && (
              <div className="form-group">
                <label htmlFor="proofImage">Upload Proof (Optional Image)</label>
                <input
                  type="file"
                  id="proofImage"
                  name="proofImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                {proofImage && <p className="file-name">Selected: {proofImage.name}</p>}
              </div>
            )}
            
            <div className="notes-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={cancelNotes}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={submitAction}
                disabled={markAsTaken.isPending || markAsMissed.isPending || uploadProof.isPending}
              >
                {(markAsTaken.isPending || markAsMissed.isPending || uploadProof.isPending) ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicationCard
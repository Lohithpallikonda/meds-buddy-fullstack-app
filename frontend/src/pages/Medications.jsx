import { useState } from 'react'
import { useAuth } from '../utils/AuthContext'
import { useWebSocket } from '../utils/WebSocketContext'
import { useMedications } from '../hooks/useMedications'
import MedicationCard from '../components/dashboard/MedicationCard'
import AddMedication from '../components/dashboard/AddMedication'
import NotificationCenter from '../components/realtime/NotificationCenter'
import LoadingSpinner from '../components/common/LoadingSpinner'
import '../styles/Medications.css'

const Medications = () => {
  const { user, logout } = useAuth()
  const { isConnected } = useWebSocket()
  const [showAddMedication, setShowAddMedication] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'active', 'inactive'

  const { 
    data: medicationsData, 
    isLoading, 
    error,
    refetch 
  } = useMedications()

  const medications = medicationsData?.medications || []

  const filteredMedications = medications.filter(med => {
    if (filter === 'all') return true
    if (filter === 'active') return med.is_active !== false
    if (filter === 'inactive') return med.is_active === false
    return true
  })

  if (isLoading) {
    return <LoadingSpinner message="Loading medications..." />
  }

  if (error) {
    return (
      <div className="medications-error">
        <h3>Unable to load medications</h3>
        <p>Please try refreshing the page.</p>
        <button onClick={() => refetch()} className="btn btn-primary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="medications-container">
      <header className="medications-header">
        <div className="header-left">
          <h1>My Medications</h1>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
        
        <div className="header-actions">
          <NotificationCenter />
          <button 
            onClick={() => setShowAddMedication(true)}
            className="btn btn-primary"
          >
            Add Medication
          </button>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="medications-controls">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({medications.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({medications.filter(m => m.is_active !== false).length})
          </button>
          <button 
            className={`filter-tab ${filter === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilter('inactive')}
          >
            Inactive ({medications.filter(m => m.is_active === false).length})
          </button>
        </div>

        <button onClick={() => refetch()} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <main className="medications-main">
        {filteredMedications.length > 0 ? (
          <div className="medications-grid">
            {filteredMedications.map(medication => (
              <MedicationCard
                key={medication.id}
                medication={medication}
                showActions={true}
                onUpdate={() => refetch()}
              />
            ))}
          </div>
        ) : (
          <div className="no-medications">
            <div className="empty-state">
              <h3>No medications found</h3>
              <p>
                {filter === 'all' 
                  ? "You haven't added any medications yet."
                  : `No ${filter} medications to display.`
                }
              </p>
              <button 
                onClick={() => setShowAddMedication(true)}
                className="btn btn-primary"
              >
                Add Your First Medication
              </button>
            </div>
          </div>
        )}
      </main>

      {showAddMedication && (
        <AddMedication
          onClose={() => setShowAddMedication(false)}
          onSuccess={() => {
            setShowAddMedication(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}

export default Medications
import { useState, useEffect } from 'react'
import { useAuth } from '../utils/AuthContext'
import { useWebSocket } from '../utils/WebSocketContext'
import { useTodaysMedications, useMedicationStats } from '../hooks/useMedications'
import AddMedication from '../components/dashboard/AddMedication'
import MedicationCard from '../components/dashboard/MedicationCard'
import NotificationCenter from '../components/realtime/NotificationCenter'
import { formatDateTime } from '../utils/medicationApi'
import '../styles/Dashboard.css'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const { 
    isConnected, 
    emitMedicationTaken, 
    emitMedicationMissed, 
    emitMedicationAdded,
    notifications,
    unreadCount
  } = useWebSocket()
  
  const [showAddMedication, setShowAddMedication] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  // Fetch data using React Query hooks
  const { 
    data: todaysData, 
    isLoading: todaysLoading, 
    error: todaysError,
    refetch: refetchTodays
  } = useTodaysMedications()
  
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats
  } = useMedicationStats()

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTodays()
      refetchStats()
      setLastUpdate(new Date())
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [refetchTodays, refetchStats])

  // Listen for real-time medication updates
  useEffect(() => {
    if (isConnected) {
      // Refresh data when we receive real-time updates
      const refreshData = () => {
        refetchTodays()
        refetchStats()
        setLastUpdate(new Date())
      }

      // You can add more specific event listeners here
      // For now, we'll refresh on any notification that might affect the dashboard
      if (notifications.length > 0) {
        const lastNotification = notifications[0]
        if (['medication_reminder', 'adherence_alert', 'patient_update'].includes(lastNotification.type)) {
          refreshData()
        }
      }
    }
  }, [isConnected, notifications, refetchTodays, refetchStats])

  const handleLogout = () => {
    logout()
  }

  const handleAddSuccess = (medication) => {
    // Emit WebSocket event for real-time updates
    emitMedicationAdded(medication)
    console.log('Medication added successfully!')
  }

  const handleMedicationTaken = (medication, notes) => {
    // Emit WebSocket event for real-time updates
    emitMedicationTaken({ ...medication, notes })
  }

  const handleMedicationMissed = (medication, notes) => {
    // Emit WebSocket event for real-time updates
    emitMedicationMissed({ ...medication, notes })
  }

  const handleRefresh = () => {
    refetchTodays()
    refetchStats()
    setLastUpdate(new Date())
  }

  // Loading state
  if (todaysLoading || statsLoading) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>MedsBuddy Dashboard</h1>
          <div className="header-actions">
            <div className="connection-status">
              <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
              <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
            </div>
            <NotificationCenter />
            <span>Welcome, {user?.username}!</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your medications...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (todaysError || statsError) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>MedsBuddy Dashboard</h1>
          <div className="header-actions">
            <div className="connection-status">
              <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <NotificationCenter />
            <span>Welcome, {user?.username}!</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="error-container">
            <h3>Unable to load data</h3>
            <p>Please try refreshing the page or contact support if the problem persists.</p>
            <button onClick={handleRefresh} className="btn btn-primary">
              Refresh Data
            </button>
          </div>
        </main>
      </div>
    )
  }

  const todaysMedications = todaysData?.medications || []
  const stats = statsData?.stats || {}
  const recentActivity = statsData?.recent_activity || []

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>MedsBuddy Dashboard</h1>
        <div className="header-actions">
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          <NotificationCenter />
          <span>Welcome, {user?.username}!</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Real-time status bar */}
        <div className="realtime-status">
          <div className="status-info">
            <span className="last-update">Last updated: {lastUpdate.toLocaleTimeString()}</span>
            {unreadCount > 0 && (
              <span className="notification-alert">
                {unreadCount} new notification{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button onClick={handleRefresh} className="refresh-btn" title="Refresh data">
            🔄
          </button>
        </div>

        <div className="dashboard-grid">
          {/* Today's Medications Card */}
          <div className="dashboard-card">
            <h3>Today's Medications</h3>
            {todaysMedications.length > 0 ? (
              <div className="todays-summary">
                <p><strong>{stats.taken_today || 0}</strong> of <strong>{stats.total_medications || 0}</strong> taken today</p>
                {stats.pending_today > 0 && (
                  <p className="pending-count">{stats.pending_today} medications pending</p>
                )}
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${stats.total_medications ? (stats.taken_today / stats.total_medications) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <p>No medications scheduled for today.</p>
            )}
          </div>

          {/* Adherence Rate Card */}
          <div className="dashboard-card">
            <h3>Adherence Rate</h3>
            <div className="adherence-display">
              <span className="adherence-rate">{stats.adherence_rate || 0}%</span>
              <p>Overall adherence (30 days)</p>
            </div>
            {stats.adherence_details && (
              <div className="adherence-details">
                <small>
                  {stats.adherence_details.taken_doses} of {stats.adherence_details.expected_doses} doses taken
                </small>
                <div className="adherence-trend">
                  {stats.adherence_rate >= 80 ? '📈 Great job!' : stats.adherence_rate >= 60 ? '📊 Keep improving' : '📉 Needs attention'}
                </div>
              </div>
            )}
          </div>

          {/* Medication Streak Card */}
          <div className="dashboard-card">
            <h3>Medication Streak</h3>
            <div className="streak-display">
              <span className="streak-count">{stats.medication_streak || 0}</span>
              <p>Days in a row</p>
            </div>
            <small>Consecutive days taking all medications</small>
            {stats.medication_streak > 0 && (
              <div className="streak-celebration">
                {stats.medication_streak >= 30 ? '🏆' : stats.medication_streak >= 7 ? '🎉' : '💪'}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="dashboard-card">
            <h3>Quick Actions</h3>
            <button 
              className="action-button"
              onClick={() => setShowAddMedication(true)}
            >
              Add Medication
            </button>
            <button 
              className="action-button"
              onClick={handleRefresh}
            >
              Refresh Data
            </button>
            {user.role === 'caretaker' && (
              <button 
                className="action-button"
                onClick={() => console.log('View Patients')}
              >
                View Patients
              </button>
            )}
          </div>
        </div>

        {/* Today's Medications List */}
        {todaysMedications.length > 0 && (
          <div className="dashboard-section">
            <h3>Today's Schedule</h3>
            <div className="medications-grid">
              {todaysMedications.map(medication => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  showActions={true}
                  onTaken={(med, notes) => handleMedicationTaken(med, notes)}
                  onMissed={(med, notes) => handleMedicationMissed(med, notes)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="dashboard-section">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={activity.id || index} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-medication">{activity.medication_name}</span>
                    <span className={`activity-action ${activity.status}`}>{activity.status}</span>
                    <span className="activity-date">{formatDateTime(activity.created_at)}</span>
                  </div>
                  {activity.notes && (
                    <div className="activity-notes">
                      <small>{activity.notes}</small>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No recent activity to display.</p>
            )}
          </div>
        </div>
      </main>

      {/* Add Medication Modal */}
      {showAddMedication && (
        <AddMedication
          onClose={() => setShowAddMedication(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  )
}

export default Dashboard
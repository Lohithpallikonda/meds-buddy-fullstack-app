import { useState } from 'react'
import { useAuth } from '../utils/AuthContext'
import { useWebSocket } from '../utils/WebSocketContext'
import NotificationCenter from '../components/realtime/NotificationCenter'
import '../styles/Settings.css'

const Settings = () => {
  const { user, logout } = useAuth()
  const { isConnected } = useWebSocket()
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    email_notifications: true,
    reminder_frequency: 'daily',
    theme: 'light',
    language: 'en',
    timezone: 'UTC'
  })

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = () => {
    // TODO: Implement settings save API call
    console.log('Saving settings:', settings)
  }

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="header-left">
          <h1>Settings</h1>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
        
        <div className="header-actions">
          <NotificationCenter />
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="settings-main">
        <div className="settings-sections">
          {/* Account Settings */}
          <div className="settings-section">
            <h3>Account Information</h3>
            <div className="setting-item">
              <label>Username</label>
              <input type="text" value={user?.username || ''} disabled />
            </div>
            <div className="setting-item">
              <label>Email</label>
              <input type="email" value={user?.email || ''} disabled />
            </div>
            <div className="setting-item">
              <label>Role</label>
              <input type="text" value={user?.role || 'patient'} disabled />
            </div>
          </div>

          {/* Notification Settings */}
          <div className="settings-section">
            <h3>Notifications</h3>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.notifications_enabled}
                  onChange={(e) => handleSettingChange('notifications_enabled', e.target.checked)}
                />
                Enable push notifications
              </label>
            </div>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.email_notifications}
                  onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
                />
                Enable email notifications
              </label>
            </div>
            <div className="setting-item">
              <label>Reminder Frequency</label>
              <select
                value={settings.reminder_frequency}
                onChange={(e) => handleSettingChange('reminder_frequency', e.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="settings-section">
            <h3>Appearance</h3>
            <div className="setting-item">
              <label>Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div className="setting-item">
              <label>Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>

          {/* System Settings */}
          <div className="settings-section">
            <h3>System</h3>
            <div className="setting-item">
              <label>Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="settings-actions">
            <button onClick={handleSaveSettings} className="btn btn-primary">
              Save Settings
            </button>
            <button onClick={() => window.location.reload()} className="btn btn-secondary">
              Reset to Defaults
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Settings
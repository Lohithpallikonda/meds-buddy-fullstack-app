import './LoadingSpinner.css'

const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${size}`}>
        <div className="spinner"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  )
}

export default LoadingSpinner
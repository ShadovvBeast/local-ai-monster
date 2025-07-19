import React from 'react';

interface StatusBarProps {
  status: string;
  progress: number | null;
}

const StatusBar: React.FC<StatusBarProps> = ({ status, progress }) => {
  const getStatusIcon = () => {
    if (status.toLowerCase().includes('loading') || status.toLowerCase().includes('processing')) {
      return (
        <svg className="status-icon loading" width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="60" strokeDashoffset="60">
            <animate attributeName="stroke-dashoffset" dur="2s" values="60;0" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    if (status.toLowerCase().includes('error')) {
      return (
        <svg className="status-icon error" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      );
    }
    return (
      <svg className="status-icon ready" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22,4 12,14.01 9,11.01"></polyline>
      </svg>
    );
  };

  return (
    <div className="status-bar">
      <div className="status-content">
        {getStatusIcon()}
        <span className="status-text">{status}</span>
      </div>
      {progress !== null && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="progress-text">{Math.round(progress * 100)}%</span>
        </div>
      )}
    </div>
  );
};

export default StatusBar;
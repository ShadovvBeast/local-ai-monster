import React from 'react';

interface StatusBarProps {
  status: string;
  progress: number | null;
}

const StatusBar: React.FC<StatusBarProps> = ({ status, progress }) => {
  return (
    <div className="status-bar">
      <span className="status">{status}</span>
      {progress !== null && <progress value={progress} max={1} className="progress" />}
    </div>
  );
};

export default StatusBar;
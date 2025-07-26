import React from 'react';
import GPUDisplay from '../GPUDisplay';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  detectedGpu: string | null;
  detectedVram: number | null;
  status: string;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, detectedGpu, detectedVram, status }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="sidebar-toggle" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="header-center">
        <div className="logo-container">
          <img src="/logo.png" alt="Local AI Monster" className="logo" />
          <h1 className="app-title">Local AI Monster</h1>
        </div>
      </div>
      
      <div className="header-right">
        <GPUDisplay detectedGpu={detectedGpu} detectedVram={detectedVram} status={status} />
      </div>
    </header>
  );
};

export default Header;
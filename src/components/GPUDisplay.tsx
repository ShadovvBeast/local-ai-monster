import React from 'react';
import './GPUDisplay.css';

interface GPUDisplayProps {
  detectedGpu: string | null;
  status: string;
}

const GPUDisplay: React.FC<GPUDisplayProps> = ({ detectedGpu, status }) => {
  const isLoading = !detectedGpu && status.includes('Checking');
  const hasError = status.includes('Failed') || status.includes('not supported');

  const getGPUBrand = (gpuName: string | null): string => {
    if (!gpuName) return 'unknown';
    const name = gpuName.toLowerCase();
    if (name.includes('nvidia') || name.includes('geforce') || name.includes('rtx') || name.includes('gtx')) return 'nvidia';
    if (name.includes('amd') || name.includes('radeon') || name.includes('rx')) return 'amd';
    if (name.includes('intel') || name.includes('arc') || name.includes('iris')) return 'intel';
    return 'unknown';
  };

  const formatGPUName = (gpuName: string | null): string => {
    if (!gpuName) return '';
    
    // Split by spaces and capitalize each word
    return gpuName
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Special handling for common GPU terms
        if (word === 'rtx' || word === 'gtx' || word === 'rx') return word.toUpperCase();
        if (word === 'nvidia') return 'NVIDIA';
        if (word === 'amd') return 'AMD';
        if (word === 'intel') return 'Intel';
        if (word === 'geforce') return 'GeForce';
        if (word === 'radeon') return 'Radeon';
        if (word === 'arc') return 'Arc';
        if (word === 'iris') return 'Iris';
        if (word === 'ti') return 'Ti';
        if (word === 'super') return 'SUPER';
        
        // Capitalize first letter of other words
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  const brand = getGPUBrand(detectedGpu);

  // Debug log to see what we're getting
  console.log('GPU Display - detectedGpu:', detectedGpu, 'status:', status, 'brand:', brand);

  return (
    <div className={`gpu-display ${isLoading ? 'loading' : ''} ${hasError ? 'error' : ''} ${brand}`}>
      <div className="gpu-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M4 6h16v12H4V6z" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none"
          />
          <path 
            d="M6 8h12v8H6V8z" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            fill="currentColor" 
            fillOpacity="0.1"
          />
          <circle cx="8" cy="10" r="0.5" fill="currentColor"/>
          <circle cx="10" cy="10" r="0.5" fill="currentColor"/>
          <circle cx="12" cy="10" r="0.5" fill="currentColor"/>
          <circle cx="14" cy="10" r="0.5" fill="currentColor"/>
          <circle cx="16" cy="10" r="0.5" fill="currentColor"/>
          <circle cx="8" cy="12" r="0.5" fill="currentColor"/>
          <circle cx="10" cy="12" r="0.5" fill="currentColor"/>
          <circle cx="12" cy="12" r="0.5" fill="currentColor"/>
          <circle cx="14" cy="12" r="0.5" fill="currentColor"/>
          <circle cx="16" cy="12" r="0.5" fill="currentColor"/>
          <circle cx="8" cy="14" r="0.5" fill="currentColor"/>
          <circle cx="10" cy="14" r="0.5" fill="currentColor"/>
          <circle cx="12" cy="14" r="0.5" fill="currentColor"/>
          <circle cx="14" cy="14" r="0.5" fill="currentColor"/>
          <circle cx="16" cy="14" r="0.5" fill="currentColor"/>
        </svg>
        {isLoading && <div className="loading-spinner"></div>}
      </div>
      
      <div className="gpu-info">
        <div className="gpu-label">Graphics Card</div>
        <div className="gpu-name">
          {isLoading ? (
            <span className="loading-text">Detecting GPU...</span>
          ) : hasError ? (
            <span className="error-text">Detection Failed</span>
          ) : detectedGpu ? (
            <span className="gpu-text" title={detectedGpu}>{formatGPUName(detectedGpu)}</span>
          ) : (
            <span className="unknown-text">Unknown GPU</span>
          )}
        </div>
        {brand !== 'unknown' && !isLoading && !hasError && (
          <div className={`gpu-brand-badge ${brand}`}>
            {brand.toUpperCase()}
          </div>
        )}
      </div>

      <div className="gpu-status-indicator">
        <div className={`status-dot ${isLoading ? 'loading' : hasError ? 'error' : 'success'}`}></div>
      </div>
    </div>
  );
};

export default GPUDisplay;

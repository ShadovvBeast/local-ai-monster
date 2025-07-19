import React, { useState, useEffect } from 'react';
import './ThinkingComponent.css';

interface ThinkingComponentProps {
  content: string;
  isStreaming?: boolean;
}

export const ThinkingComponent: React.FC<ThinkingComponentProps> = ({ content, isStreaming = false }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      // Ensure content is always a string
      const safeContent = typeof content === 'string' ? content : String(content || '');
      
      // Debug logging to track state transitions
      console.log('ThinkingComponent update:', {
        content: safeContent,
        isStreaming,
        contentType: typeof content
      });
      
      if (isStreaming) {
        // For streaming content, show immediately without typing animation
        // to prevent flickering and ensure readability
        setDisplayedContent(safeContent);
      } else {
        // For completed content, show immediately as well
        setDisplayedContent(safeContent);
      }
    } catch (error) {
      console.error('Error in ThinkingComponent useEffect:', error);
      setDisplayedContent(String(content || ''));
    }
  }, [content, isStreaming]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`thinking-container ${isVisible ? 'visible' : ''}`}>
      <div className="thinking-header" onClick={toggleExpanded}>
        <div className="thinking-icon">
          <div className="brain-icon">🧠</div>
          <div className="thinking-pulse"></div>
        </div>
        <span className="thinking-label">AI is thinking...</span>
        <div className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      <div className={`thinking-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="thinking-text">
          {displayedContent}
        </div>
      </div>
    </div>
  );
};

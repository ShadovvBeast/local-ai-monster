import React, { useState } from 'react';
import { Model, Chat } from '../../types';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  newChat: () => void;
  chats: Chat[];
  currentChatId: string;
  setCurrentChatId: (id: string) => void;
  models: Model[];
  selectedModel: string | null;
  setSelectedModel: (id: string | null) => void;
  loadModel: (id: string) => Promise<void>;
  temperature: number;
  setTemperature: (n: number) => void;
  maxTokens: number;
  setMaxTokens: (n: number) => void;
  optimizeMode: 'speed' | 'balanced' | 'quality';
  setOptimizeMode: (m: 'speed' | 'balanced' | 'quality') => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  newChat,
  chats,
  currentChatId,
  setCurrentChatId,
  models,
  selectedModel,
  setSelectedModel,
  loadModel,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  optimizeMode,
  setOptimizeMode,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(true);

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      {/* Header */}
      <div className="sidebar-header">
        <button
          onClick={newChat}
          className="new-chat-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Chat
        </button>
      </div>

      {/* Chat list */}
      <div className="chat-list">
        {chats.map((chat) => (
          <div key={chat.id}>
            <button
              onClick={() => {
                setCurrentChatId(chat.id);
                setSidebarOpen(false);
              }}
              className={`chat-item ${
                chat.id === currentChatId ? 'active' : ''
              }`}
            >
              {chat.title || 'New Chat'}
            </button>
          </div>
        ))}
      </div>

      {/* Settings section */}
      <div className="settings-section">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="settings-toggle"
        >
          <span>Settings</span>
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ transform: settingsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </button>
        
        {settingsOpen && (
          <div className="settings-content">
            {/* Model select */}
            <div className="setting-group">
              <label className="setting-label">Model</label>
              <select
                value={selectedModel || ''}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  loadModel(e.target.value);
                }}
                className="setting-select"
              >
                <option value="">Select a model...</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} ({m.params}B)
                  </option>
                ))}
              </select>
              <button 
                onClick={() => selectedModel && loadModel(selectedModel)}
                className="load-model-btn"
                disabled={!selectedModel}
              >
                Load Model
              </button>
            </div>

            {/* Temperature */}
            <div className="setting-group">
              <label className="setting-label">Temperature: {temperature.toFixed(1)}</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="setting-range"
              />
            </div>

            {/* Max tokens */}
            <div className="setting-group">
              <label className="setting-label">Max Tokens</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)}
                className="setting-select"
                min="1"
                max="8192"
              />
            </div>

            {/* Optimize mode */}
            <div className="setting-group">
              <label className="setting-label">Optimize Mode</label>
              <select
                value={optimizeMode}
                onChange={(e) => setOptimizeMode(e.target.value as 'speed' | 'balanced' | 'quality')}
                className="setting-select"
              >
                <option value="speed">Speed</option>
                <option value="balanced">Balanced</option>
                <option value="quality">Quality</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

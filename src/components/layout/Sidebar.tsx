import React from 'react';
import { ExpansionPanel } from '@chatscope/chat-ui-kit-react';
import { Model, Chat } from '../../types';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newChat: () => void;
  chats: Chat[];
  currentChatId: string;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string>>;
  models: Model[];
  selectedModel: string | null;
  setSelectedModel: React.Dispatch<React.SetStateAction<string | null>>;
  loadModel: (modelId: string) => Promise<void>;
  temperature: number;
  setTemperature: React.Dispatch<React.SetStateAction<number>>;
  maxTokens: number;
  setMaxTokens: React.Dispatch<React.SetStateAction<number>>;
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
}) => {
  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <button onClick={newChat} className="new-chat-btn">+ New Chat</button>
      <ul className="chat-list">
        {chats.map(chat => (
          <li
            key={chat.id}
            onClick={() => {
              setCurrentChatId(chat.id);
              setSidebarOpen(false);
            }}
            className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}
          >
            {chat.title}
          </li>
        ))}
      </ul>
      <ExpansionPanel title="Settings" className="settings-panel">
        <div className="setting">
          <label>Model</label>
          <select
            value={selectedModel || ''}
            onChange={e => {
              setSelectedModel(e.target.value);
              loadModel(e.target.value);
            }}
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.id} ({m.params}B)
              </option>
            ))}
          </select>
        </div>
        <div className="setting">
          <label>Temperature: {temperature.toFixed(1)}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={temperature}
            onChange={e => setTemperature(parseFloat(e.target.value))}
          />
        </div>
        <div className="setting">
          <label>Max Tokens: {maxTokens}</label>
          <input
            type="number"
            value={maxTokens}
            onChange={e => setMaxTokens(parseInt(e.target.value))}
          />
        </div>
      </ExpansionPanel>
    </aside>
  );
};

export default Sidebar;
import React, { useEffect, useRef, useState } from 'react';
import { AssistantMessageContent } from './AssistantMessageContent';
import { Chat as ChatType } from '../types';
import * as webllm from '@mlc-ai/web-llm';

interface ChatViewProps {
  currentChat: ChatType;
  typing: boolean;
  handleSend: (text: string) => Promise<void>;
  engine: webllm.MLCEngine | null;
}

const ChatView: React.FC<ChatViewProps> = ({ currentChat, typing, handleSend, engine }) => {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat.messages.length, typing]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !engine) return;
    await handleSend(text);
    setDraft('');
  };

  const WelcomeMessage = () => (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="welcome-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4"></path>
            <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"></path>
            <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"></path>
            <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"></path>
            <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"></path>
          </svg>
        </div>
        <h2 className="welcome-title">Welcome to Local AI Monster</h2>
        <p className="welcome-description">
          Your powerful local AI assistant is ready to help. Start a conversation by typing a message below.
        </p>
        <div className="welcome-features">
          <div className="feature-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <span>Runs entirely on your device</span>
          </div>
          <div className="feature-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Private and secure</span>
          </div>
          <div className="feature-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Customizable settings</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="chat-view">
      {/* Message list */}
      <div className="message-area">
        {currentChat.messages.length === 0 ? (
          <WelcomeMessage />
        ) : (
          currentChat.messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}>
                <div className={`message-bubble ${isUser ? 'user-message' : 'assistant-message'}`}>
                  {msg.role === 'assistant' ? (
                    <AssistantMessageContent
                      content={msg.content}
                      isStreaming={typing && i === currentChat.messages.length - 1}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })
        )}

        {typing && (
          <div className="message-wrapper assistant">
            <div className="message-bubble assistant-message typing">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              Thinking…
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={onSubmit} className="chat-input-form">
        <div className="input-container">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your message…"
            rows={1}
            name="message"
            className="chat-input"
            disabled={!engine}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e as any);
              }
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || !engine}
            className="send-button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatView;

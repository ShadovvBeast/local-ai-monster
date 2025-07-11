import React from 'react';
import {
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  Avatar,
} from '@chatscope/chat-ui-kit-react';
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
  return (
    <ChatContainer>
      <MessageList typingIndicator={typing ? <TypingIndicator content="Thinking..." /> : null}>
        {currentChat.messages.map((msg, i) => (
          <Message
            key={i}
            model={{
              direction: msg.role === 'user' ? 'outgoing' : 'incoming',
              position: 'single',
            }}

          >
            {msg.role === 'assistant' && (
              <Avatar src="/logo.png" className="avatar" />
            )}

            {msg.role === 'assistant' ? (
              <Message.CustomContent>
                <AssistantMessageContent
                  content={msg.content}
                  isStreaming={typing && i === currentChat.messages.length - 1}
                />
              </Message.CustomContent>
            ) : (
              <Message.CustomContent>{msg.content}</Message.CustomContent>
            )}

            {msg.role === 'user' && (
              <Avatar src="/user.jpg" className="avatar" />
            )}
          </Message>
        ))}
      </MessageList>
      <MessageInput placeholder="Type message..." onSend={handleSend} disabled={!engine} attachButton={false} />
    </ChatContainer>
  );
};

export default ChatView;
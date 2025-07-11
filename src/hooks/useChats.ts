import { useState, useEffect } from 'react';
import { Chat } from '../types';

export const useChats = () => {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('chats');
    return saved ? JSON.parse(saved) : [{ id: '1', title: 'New Chat', messages: [] }];
  });
  const [currentChatId, setCurrentChatId] = useState('1');
  const [typing, setTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentChat = chats.find(c => c.id === currentChatId) || chats[0];

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  const updateChat = (updated: Chat) => {
    setChats(chats.map(c => c.id === updated.id ? updated : c));
  };

  const newChat = () => {
    const id = Date.now().toString();
    setChats([...chats, { id, title: 'New Chat', messages: [] }]);
    setCurrentChatId(id);
  };

  return {
    chats,
    currentChatId,
    setCurrentChatId,
    typing,
    setTyping,
    currentChat,
    updateChat,
    newChat,
    sidebarOpen,
    setSidebarOpen,
  };
};
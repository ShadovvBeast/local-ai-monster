import React from 'react';
import { useModels } from './hooks/useModels';
import { useChats } from './hooks/useChats';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import StatusBar from './components/StatusBar';
import ChatView from './components/ChatView';
import './App.css';

const App: React.FC = () => {
  const {
    status,
    setStatus,
    progress,
    models,
    selectedModel,
    engine,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    setSelectedModel,
    loadModel,
  } = useModels();

  const {
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
  } = useChats();

  const handleSend = async (text: string) => {
    if (!text || !engine) return;
    setTyping(true);
    const newMessages = [...currentChat.messages, { role: 'user', content: text }];
    updateChat({ ...currentChat, messages: newMessages });
    const history = [
      { role: 'system', content: 'You are Local AI Monster, a powerful local AI assistant.' },
      ...newMessages,
    ];
    try {
      const chunks = await engine.chat.completions.create({
        messages: history,
        stream: true,
        temperature,
        max_tokens: maxTokens,
      });
      let response = '';
      updateChat({ ...currentChat, messages: [...newMessages, { role: 'assistant', content: '' }] });
      for await (const chunk of chunks) {
        response += chunk.choices[0]?.delta?.content || '';
        updateChat({ ...currentChat, messages: [...newMessages, { role: 'assistant', content: response }] });
      }
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="app">
        <Header setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} />
        <div className="content">
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            newChat={newChat}
            chats={chats}
            currentChatId={currentChatId}
            setCurrentChatId={setCurrentChatId}
            models={models}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            loadModel={loadModel}
            temperature={temperature}
            setTemperature={setTemperature}
            maxTokens={maxTokens}
            setMaxTokens={setMaxTokens}
          />
          <main className="main">
            <StatusBar status={status} progress={progress} />
            <ChatView
              currentChat={currentChat}
              typing={typing}
              handleSend={handleSend}
              engine={engine}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
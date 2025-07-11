import React, { useState, useEffect } from 'react';
import * as webllm from '@mlc-ai/web-llm';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  Avatar,
  ExpansionPanel,
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { useLLMOutput } from '@llm-ui/react';
import { markdownLookBack } from '@llm-ui/markdown';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock, useCodeBlockToHtml, allLangs, allLangsAlias } from '@llm-ui/code';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import parse from "html-react-parser";
import { loadHighlighter } from '@llm-ui/code';
import { createHighlighterCore } from 'shiki/core';
import { bundledLanguagesInfo } from 'shiki/langs';
import getWasm from 'shiki/wasm';
import { bundledThemes } from 'shiki/themes';
import { createOnigurumaEngine } from '@shikijs/engine-oniguruma';
import './App.css';

interface Model {
  id: string;
  params: number;
  vram: number;
}

interface Chat {
  id: string;
  title: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

const highlighter = loadHighlighter(
  createHighlighterCore({
    langs: allLangs(bundledLanguagesInfo),
    langAlias: allLangsAlias(bundledLanguagesInfo),
    themes: Object.values(bundledThemes),
    engine: createOnigurumaEngine(getWasm),
  }),
);

const codeToHtmlOptions = { theme: 'github-dark' };

const MarkdownComponent = ({ blockMatch }) => {
  const markdown = blockMatch.output;
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>;
};

const CodeComponent = ({ blockMatch }) => {
  const { html, code } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter,
    codeToHtmlOptions,
  });
  if (!html) {
    return <pre className="shiki"><code>{code}</code></pre>;
  }
  return parse(html);
};

const AssistantMessageContent = ({ content, isStreaming }) => {
  const { blockMatches } = useLLMOutput({
    llmOutput: content,
    isStreamFinished: !isStreaming,
    blocks: [
      {
        component: CodeComponent,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
  });

  return (
    <>
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return <Component key={index} blockMatch={blockMatch} />;
      })}
    </>
  );
};

const App: React.FC = () => {
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState<number | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [engine, setEngine] = useState<webllm.MLCEngine | null>(null);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(256);
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

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setStatus('Checking WebGPU support...');
    if (!navigator.gpu) {
      setStatus('WebGPU not supported.');
      return;
    }
    setStatus('Estimating VRAM...');
    const vram = await estimateVRAM();
    setStatus(`Estimated VRAM: ${vram.toFixed(0)} MB`);
    setStatus('Fetching models...');
    let modelList = await fetchModels();
    if (modelList.length === 0) {
      setStatus('Using fallback models.');
      modelList = fallbackModels();
    }
    setModels(modelList);
    const available = modelList.filter(m => m.vram < vram * 0.9);
    if (available.length === 0) {
      setStatus('Insufficient VRAM.');
      return;
    }
    setStatus('Selecting best model...');
    available.sort((a, b) => b.params - a.params);
    const best = available[0].id;
    setSelectedModel(best);
    await loadModel(best);
  }

  function fallbackModels(): Model[] {
    return [
      { id: 'Llama-3-8B-Instruct-q4f16_1-MLC', params: 8, vram: 5600 },
      { id: 'Phi-3-mini-4k-instruct-q4f16_1-MLC', params: 3.8, vram: 2660 },
      { id: 'gemma-2-9b-it-q4f16_1-MLC', params: 9, vram: 6300 },
    ];
  }

  async function fetchModels(): Promise<Model[]> {
    try {
      const res = await fetch('https://huggingface.co/api/models?author=mlc-ai&sort=downloads&direction=-1&limit=50');
      const data = await res.json();
      return data
        .filter((m: any) => m.id.endsWith('-MLC') && m.id.includes('Instruct'))
        .map((m: any) => {
          const shortId = m.id.split('/')[1];
          const paramsMatch = m.id.match(/([\d.]+)B/);
          const params = paramsMatch ? parseFloat(paramsMatch[1]) : 0;
          const vram = params * 700;
          return { id: shortId, params, vram };
        })
        .filter((m: Model) => m.params > 0);
    } catch {
      return [];
    }
  }

  async function estimateVRAM(): Promise<number> {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return 0;
    const device = await adapter.requestDevice();
    let low = 0, high = 32 * 1024 * 1024 * 1024;
    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2);
      try {
        const buffer = device.createBuffer({ size: mid, usage: GPUBufferUsage.STORAGE });
        buffer.destroy();
        low = mid;
      } catch {
        high = mid - 1;
      }
    }
    device.destroy();
    return low / (1024 * 1024);
  }

  async function loadModel(modelId: string) {
    setStatus(`Loading ${modelId}...`);
    setProgress(0);
    const initProgress = (report: any) => {
      setStatus(report.text);
      setProgress(report.progress);
    };
    try {
      const loadedEngine = await webllm.CreateMLCEngine(modelId, { initProgressCallback: initProgress });
      setEngine(loadedEngine);
      setStatus('Ready.');
      setProgress(null);
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
      setProgress(null);
    }
  }

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

  const updateChat = (updated: Chat) => {
    setChats(chats.map(c => c.id === updated.id ? updated : c));
  };

  const newChat = () => {
    const id = Date.now().toString();
    setChats([...chats, { id, title: 'New Chat', messages: [] }]);
    setCurrentChatId(id);
  };

  return (
    <div className="app-wrapper">
      <div className="app">
        <header className="header">
          <img src="/logo.png" alt="Local AI Monster" className="logo" />
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
        </header>
        <div className="content">
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
          <main className="main">
            <div className="status-bar">
              <span className="status">{status}</span>
              {progress !== null && <progress value={progress} max={1} className="progress" />}
            </div>
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
                    <Avatar src={msg.role === 'assistant' ? '/logo.png' : undefined} className="avatar" />
                  </Message>
                ))}
              </MessageList>
              <MessageInput placeholder="Type message..." onSend={handleSend} disabled={!engine} attachButton={false} />
            </ChatContainer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
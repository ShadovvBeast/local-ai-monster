// src/hooks/useModels.ts
import { useState, useEffect } from 'react';
import * as webllm from '@mlc-ai/web-llm';
import { Model } from '../types';

export const useModels = () => {
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState<number | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [engine, setEngine] = useState<webllm.MLCEngine | null>(null);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(256);

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

  return {
    status,
    setStatus,
    progress,
    models,
    selectedModel,
    setSelectedModel,
    engine,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    loadModel,
  };
};
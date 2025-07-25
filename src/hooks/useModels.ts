import { useState, useEffect } from 'react';
import * as webllm from '@mlc-ai/web-llm';
import { getGPUTier } from 'detect-gpu';

import { Model } from '../types';
import { getGPUMemory, getGPUVendor, getGPUPlatform, estimateGPUMemory } from '../utils/gpu-lookup';

export const useModels = () => {
  const [status, setStatus] = useState('Initializing...');
  const [detectedGpu, setDetectedGpu] = useState<string | null>(null);
  const [detectedVram, setDetectedVram] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  // Use MLCEngineInterface that is compatible with both normal and service-worker engines
  const [engine, setEngine] = useState<any>(null);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(256);
  type OptimizeMode = 'speed' | 'balanced' | 'quality';
  const [optimizeMode, setOptimizeMode] = useState<OptimizeMode>('balanced');
  const getRecencyWeight = (mode: OptimizeMode) => (mode === 'speed' ? 0 : mode === 'quality' ? 1 : 0.5);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setStatus('Checking WebGPU support...');
    if (!(navigator as any).gpu) {
      setStatus('WebGPU not supported.');
      return;
    }
    const gpuTier = await getGPUTier();
    if (!gpuTier || !gpuTier.gpu) {
      setStatus('Failed to detect GPU.');
      return;
    }
    setDetectedGpu(gpuTier.gpu as string);
    setStatus('Looking up GPU info...');
    const vram = getGPUMemory(gpuTier.gpu as string);
    const vendor = getGPUVendor(gpuTier.gpu as string);
    const platform = getGPUPlatform(gpuTier.gpu as string);
    
    let finalVram = vram;
    if (!finalVram) {
      // Estimate memory for unknown GPUs
      finalVram = estimateGPUMemory(gpuTier.tier || 1, platform);
      setStatus(`GPU detected (${vendor}, estimated memory: ${finalVram} MB)`);
    } else {
      const memoryType = platform === 'mobile' || platform === 'integrated' ? 'unified memory' : 'VRAM';
      setStatus(`GPU detected (${vendor}, ${memoryType}: ${finalVram} MB)`);
    }
    
    setDetectedVram(finalVram);
    const recencyWeight = getRecencyWeight(optimizeMode);
    setStatus('Fetching models...');
    let modelList = await fetchModels(finalVram, recencyWeight);
    if (modelList.length === 0) {
      setStatus('Using fallback models.');
      modelList = fallbackModels();
    }
    if (modelList.length === 0) {
      setStatus('Insufficient VRAM.');
      return;
    }
    setModels(modelList);
    setStatus('Selecting best model...');
    const best = modelList[0].id;
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

  async function fetchModels(maxVramMB: number, recencyWeight: number): Promise<Model[]> {
    const SEARCH_QUERY = 'q4f16_1'; // prefer int4 single-file weights
    const HF_URL = `https://huggingface.co/api/models?search=${SEARCH_QUERY}&library=mlc&sort=downloads&direction=-1&limit=100`;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    try {
      const res = await fetch(HF_URL);
      const data = await res.json();
      return data
        .filter((m: any) => m.library_name === 'mlc-llm')
        .map((m: any) => {
          const shortId = m.id.split('/')[1];
          const paramsMatch = m.id.match(/([\d.]+)B/);
          const params = paramsMatch ? parseFloat(paramsMatch[1]) : 0;
          const vram = params * 700;
          const modified = Date.parse(m.lastModified ?? m.createdAt ?? 0);
          return { id: shortId, params, vram, modified };
        })
        .filter((m: Model) => m.params > 0)
        .filter((m: Model) => m.vram < maxVramMB * 0.9)
        .map((m: any) => m as any)
        .sort((a: any, b: any) => {
          const now = Date.now();
          const ageA = Math.max(1, (now - a.modified) / MS_PER_DAY);
          const ageB = Math.max(1, (now - b.modified) / MS_PER_DAY);
          const scoreA = recencyWeight * (1 / ageA) + (1 - recencyWeight) * (1 / a.params);
          const scoreB = recencyWeight * (1 / ageB) + (1 - recencyWeight) * (1 / b.params);
          return scoreB - scoreA;
        });
    } catch {
      return [];
    }
  }



  async function loadModel(modelId: string) {
    setStatus(`Loading ${modelId}...`);
    setProgress(0);
    const initProgress = (report: any) => {
      setStatus(report.text);
      setProgress(report.progress);
    };
    try {
            // Leverage the Service Worker based engine to avoid re-loading models between page visits
      // Ensure the service worker is registered and active before engine creation
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.ready;
          if (!navigator.serviceWorker.controller) {
            await new Promise((res) => {
              const listener = () => {
                navigator.serviceWorker.removeEventListener('controllerchange', listener);
                res(undefined);
              };
              navigator.serviceWorker.addEventListener('controllerchange', listener);
            });
          }
        } catch {}
      }
      const loadedEngine = await webllm.CreateServiceWorkerMLCEngine(modelId, {
        initProgressCallback: initProgress,
      });
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
    detectedGpu,
    setDetectedGpu,
    detectedVram,
    optimizeMode,
    setOptimizeMode,
  };
};
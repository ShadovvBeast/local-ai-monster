export interface Model {
    id: string;
    params: number; // Billion parameters
    vram: number;  // Estimated VRAM requirement in MB
    modified?: number; // Unix epoch ms of last modification on HF, for recency scoring
  }
  
  export interface Chat {
    id: string;
    title: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
  }
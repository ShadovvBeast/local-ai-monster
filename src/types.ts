export interface Model {
    id: string;
    params: number;
    vram: number;
  }
  
  export interface Chat {
    id: string;
    title: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
  }
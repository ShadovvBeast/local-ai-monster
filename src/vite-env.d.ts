/// <reference types="vite/client" />

declare module 'virtual:pwa-register' {
  export function registerSW(options?: { immediate?: boolean }): (reloadPage?: boolean) => void
}

declare module 'vite-plugin-pwa' {
  import { Plugin } from 'vite'
  interface VitePWAOptions {
    registerType?: 'prompt' | 'autoUpdate' | 'periodicUpdate'
    includeAssets?: string[]
    workbox?: Record<string, unknown>
  }
  export function VitePWA(options?: VitePWAOptions): Plugin
}

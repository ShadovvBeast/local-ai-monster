/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'

// self.__WB_MANIFEST is injected by workbox at build time
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

clientsClaim()

// Cache static assets (already handled by precache, keep example)
registerRoute(({ request }) => request.destination === 'script' || request.destination === 'style', new CacheFirst())

// Cache WebLLM model blobs fetched from CDN (e.g., huggingface or unpkg)
registerRoute(
  ({ url }) => url.hostname.endsWith('huggingface.co') || url.pathname.endsWith('.bin') || url.pathname.endsWith('.json'),
  new StaleWhileRevalidate({ cacheName: 'webllm-models' })
)

// Fallback: respond with cached index.html for navigation requests when offline
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async () => {
    const cache = await caches.open('static-resources')
    const cached = await cache.match('/index.html')
    return cached || Response.error()
  }
)

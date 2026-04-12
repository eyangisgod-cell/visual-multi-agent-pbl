// Service Worker for Visual PBL Platform
// Cache-first strategy for static assets, network-first for API

const CACHE_NAME = 'visual-pbl-v1'
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  // Claim all clients immediately
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle offline page request
  if (request.mode === 'navigate' && !navigator.onLine) {
    event.respondWith(
      caches.match('/offline').then((cachedResponse) => {
        return cachedResponse || Response.redirect('/offline')
      })
    )
    return
  }

  // Cache-first strategy for static assets
  if (
    request.destination === 'document' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((networkResponse) => {
          // Clone and cache successful responses
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return networkResponse
        })
      }).catch(() => {
        // If fetch fails and it's a navigation request, show offline page
        if (request.mode === 'navigate') {
          return caches.match('/offline')
        }
        return new Response('Offline', { status: 503 })
      })
    )
    return
  }

  // Network-first for API requests
  event.respondWith(
    fetch(request).then((networkResponse) => {
      // Clone and cache successful responses
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone)
        })
      }
      return networkResponse
    }).catch(() => {
      // Fallback to cache for failed network requests
      return caches.match(request)
    })
  )
})

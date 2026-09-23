// Visual PBL Service Worker
// Placeholder for PWA functionality

const CACHE_NAME = 'visual-pbl-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

// Fetch event - passthrough for now
self.addEventListener('fetch', (event) => {
  // Passthrough - no caching for now
});

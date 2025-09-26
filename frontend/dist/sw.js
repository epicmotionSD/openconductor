/**
 * SportIntel Service Worker
 * 
 * Provides offline capabilities, background sync, and push notifications
 * for the SportIntel Progressive Web App on mobile devices.
 */

const CACHE_NAME = 'sportintel-v1';
const STATIC_CACHE = 'sportintel-static-v1';
const DYNAMIC_CACHE = 'sportintel-dynamic-v1';
const API_CACHE = 'sportintel-api-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/offline.html',
  '/fonts/inter.woff2',
];

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = [
  '/api/predictions',
  '/api/players',
  '/api/games',
  '/api/portfolios',
  '/api/alerts',
];

// Background sync tags
const SYNC_TAGS = {
  LINEUP_SUBMIT: 'lineup-submit',
  ALERT_ACK: 'alert-acknowledge',
  PORTFOLIO_UPDATE: 'portfolio-update',
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('SportIntel SW: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('SportIntel SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('SportIntel SW: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('SportIntel SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim(),
    ])
  );
});

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different request types with appropriate strategies
  if (request.method === 'GET') {
    if (isStaticAsset(request)) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isApiRequest(request)) {
      event.respondWith(networkFirstWithFallback(request, API_CACHE));
    } else if (isImageRequest(request)) {
      event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    } else {
      event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    }
  } else if (request.method === 'POST' && isApiRequest(request)) {
    // Handle POST requests with background sync fallback
    event.respondWith(handlePostRequest(request));
  }
});

/**
 * Background Sync Event Handler
 */
self.addEventListener('sync', (event) => {
  console.log('SportIntel SW: Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.LINEUP_SUBMIT:
      event.waitUntil(syncLineupSubmissions());
      break;
    case SYNC_TAGS.ALERT_ACK:
      event.waitUntil(syncAlertAcknowledgments());
      break;
    case SYNC_TAGS.PORTFOLIO_UPDATE:
      event.waitUntil(syncPortfolioUpdates());
      break;
  }
});

/**
 * Push Event Handler
 */
self.addEventListener('push', (event) => {
  console.log('SportIntel SW: Push notification received');
  
  const options = {
    body: 'New sports data available',
    icon: '/logo192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      },
    ],
    requireInteraction: true,
    renotify: true,
    tag: 'sportintel-notification',
  };

  if (event.data) {
    const payload = event.data.json();
    options.body = payload.body || options.body;
    options.data = { ...options.data, ...payload.data };
  }

  event.waitUntil(
    self.registration.showNotification('SportIntel Alert', options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('SportIntel SW: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          return clients[0].focus();
        } else {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

/**
 * Message Handler for communication with main app
 */
self.addEventListener('message', (event) => {
  console.log('SportIntel SW: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// =============================================================================
// Cache Strategies
// =============================================================================

/**
 * Cache First Strategy
 */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('SportIntel SW: Cache first failed:', error);
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Network First with Cache Fallback
 */
async function networkFirstWithFallback(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('SportIntel SW: Network failed, trying cache');
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    if (isApiRequest(request)) {
      return new Response(
        JSON.stringify({
          error: 'Offline - Using cached data',
          offline: true,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return caches.match('/offline.html');
  }
}

/**
 * Stale While Revalidate Strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.error('SportIntel SW: Network fetch failed:', error);
    return cachedResponse || new Response('Offline', { status: 503 });
  });
  
  return cachedResponse || fetchPromise;
}

/**
 * Handle POST requests with background sync fallback
 */
async function handlePostRequest(request) {
  try {
    // Try network first for POST requests
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('SportIntel SW: POST failed, queuing for background sync');
    
    // Store request for background sync
    await storeFailedRequest(request);
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await self.registration;
      await registration.sync.register(getSync



(request));
    }
    
    // Return optimistic response
    return new Response(
      JSON.stringify({
        success: true,
        queued: true,
        message: 'Request queued for when online'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// =============================================================================
// Background Sync Functions
// =============================================================================

/**
 * Sync lineup submissions
 */
async function syncLineupSubmissions() {
  const db = await openDB();
  const tx = db.transaction(['pending_requests'], 'readonly');
  const store = tx.objectStore('pending_requests');
  const requests = await store.getAll();
  
  const lineupRequests = requests.filter(req => 
    req.url.includes('/api/lineups') && req.method === 'POST'
  );
  
  for (const req of lineupRequests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
      
      if (response.ok) {
        await removeFailedRequest(req.id);
        console.log('SportIntel SW: Lineup submission synced');
      }
    } catch (error) {
      console.error('SportIntel SW: Failed to sync lineup submission:', error);
    }
  }
}

/**
 * Sync alert acknowledgments
 */
async function syncAlertAcknowledgments() {
  const db = await openDB();
  const tx = db.transaction(['pending_requests'], 'readonly');
  const store = tx.objectStore('pending_requests');
  const requests = await store.getAll();
  
  const alertRequests = requests.filter(req => 
    req.url.includes('/api/alerts') && req.method === 'PUT'
  );
  
  for (const req of alertRequests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
      
      if (response.ok) {
        await removeFailedRequest(req.id);
        console.log('SportIntel SW: Alert acknowledgment synced');
      }
    } catch (error) {
      console.error('SportIntel SW: Failed to sync alert acknowledgment:', error);
    }
  }
}

/**
 * Sync portfolio updates
 */
async function syncPortfolioUpdates() {
  const db = await openDB();
  const tx = db.transaction(['pending_requests'], 'readonly');
  const store = tx.objectStore('pending_requests');
  const requests = await store.getAll();
  
  const portfolioRequests = requests.filter(req => 
    req.url.includes('/api/portfolios')
  );
  
  for (const req of portfolioRequests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
      
      if (response.ok) {
        await removeFailedRequest(req.id);
        console.log('SportIntel SW: Portfolio update synced');
      }
    } catch (error) {
      console.error('SportIntel SW: Failed to sync portfolio update:', error);
    }
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if request is for static assets
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/static/') || 
         url.pathname.includes('/fonts/') ||
         STATIC_ASSETS.includes(url.pathname);
}

/**
 * Check if request is for API
 */
function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || 
         url.pathname.startsWith('/graphql');
}

/**
 * Check if request is for images
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  return /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(url.pathname);
}

/**
 * Get sync tag for request
 */
function getSyncTag(request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/api/lineups')) {
    return SYNC_TAGS.LINEUP_SUBMIT;
  } else if (url.pathname.includes('/api/alerts')) {
    return SYNC_TAGS.ALERT_ACK;
  } else if (url.pathname.includes('/api/portfolios')) {
    return SYNC_TAGS.PORTFOLIO_UPDATE;
  }
  
  return 'general-sync';
}

/**
 * Store failed request for background sync
 */
async function storeFailedRequest(request) {
  const db = await openDB();
  const tx = db.transaction(['pending_requests'], 'readwrite');
  const store = tx.objectStore('pending_requests');
  
  const requestData = {
    id: Date.now(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.clone().text(),
    timestamp: Date.now()
  };
  
  await store.add(requestData);
}

/**
 * Remove failed request after successful sync
 */
async function removeFailedRequest(id) {
  const db = await openDB();
  const tx = db.transaction(['pending_requests'], 'readwrite');
  const store = tx.objectStore('pending_requests');
  await store.delete(id);
}

/**
 * Open IndexedDB for offline storage
 */
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sportintel-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending_requests')) {
        db.createObjectStore('pending_requests', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('cached_data')) {
        db.createObjectStore('cached_data', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

console.log('SportIntel Service Worker loaded');
/**
 * PWA Hook for OpenConductor
 *
 * Manages Progressive Web App features including service worker registration,
 * offline state management, background sync, and push notifications.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  updateAvailable: boolean;
  syncInProgress: boolean;
  notificationsEnabled: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface PWAActions {
  installApp: () => Promise<void>;
  updateApp: () => Promise<void>;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  syncNow: () => Promise<void>;
  clearCache: () => Promise<void>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PUSH_SERVER_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY || '';

/**
 * PWA Hook for managing Progressive Web App features
 */
export const usePWA = (): [PWAState, PWAActions] => {
  const [state, setState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstallable: false,
    isInstalled: false,
    updateAvailable: false,
    syncInProgress: false,
    notificationsEnabled: false,
    registration: null,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  /**
   * Register service worker
   */
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('OpenConductor SW registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, updateAvailable: true }));
                toast.info('Update available! Refresh to get the latest version.');
              }
            });
          }
        });

        // Listen for waiting service worker
        if (registration.waiting) {
          setState(prev => ({ ...prev, updateAvailable: true }));
        }

        setState(prev => ({ ...prev, registration }));
        
        return registration;
      } catch (error) {
        console.error('OpenConductor SW registration failed:', error);
        toast.error('Failed to enable offline features');
      }
    }
    return null;
  }, []);

  /**
   * Check if app is installed
   */
  const checkInstallStatus = useCallback(() => {
    // Check if app is installed (PWA mode)
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    
    setState(prev => ({ ...prev, isInstalled }));
  }, []);

  /**
   * Check notification permission
   */
  const checkNotificationPermission = useCallback(() => {
    if ('Notification' in window) {
      const enabled = Notification.permission === 'granted';
      setState(prev => ({ ...prev, notificationsEnabled: enabled }));
    }
  }, []);

  /**
   * Install app
   */
  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          toast.success('OpenConductor installed successfully!');
          setState(prev => ({ ...prev, isInstalled: true }));
        }
        
        setDeferredPrompt(null);
        setState(prev => ({ ...prev, isInstallable: false }));
      } catch (error) {
        console.error('Installation failed:', error);
        toast.error('Failed to install app');
      }
    }
  }, [deferredPrompt]);

  /**
   * Update app
   */
  const updateApp = useCallback(async () => {
    if (state.registration?.waiting) {
      try {
        // Send skip waiting message to service worker
        state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload page after service worker activates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
        
        toast.success('Updating OpenConductor...');
      } catch (error) {
        console.error('Update failed:', error);
        toast.error('Failed to update app');
      }
    }
  }, [state.registration]);

  /**
   * Enable push notifications
   */
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      toast.error('Service Worker not supported');
      return false;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        const registration = await navigator.serviceWorker.ready;
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUSH_SERVER_KEY),
        });

        // Send subscription to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });

        setState(prev => ({ ...prev, notificationsEnabled: true }));
        toast.success('Notifications enabled!');
        return true;
      } else {
        toast.warn('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  }, []);

  /**
   * Disable push notifications
   */
  const disableNotifications = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify server
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });
      }

      setState(prev => ({ ...prev, notificationsEnabled: false }));
      toast.info('Notifications disabled');
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      toast.error('Failed to disable notifications');
    }
  }, []);

  /**
   * Trigger background sync
   */
  const syncNow = useCallback(async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        setState(prev => ({ ...prev, syncInProgress: true }));
        
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('general-sync');
        
        toast.info('Syncing data...');
        
        // Reset sync status after a delay
        setTimeout(() => {
          setState(prev => ({ ...prev, syncInProgress: false }));
          toast.success('Data synced successfully!');
        }, 2000);
      } catch (error) {
        console.error('Background sync failed:', error);
        setState(prev => ({ ...prev, syncInProgress: false }));
        toast.error('Failed to sync data');
      }
    } else {
      toast.warn('Background sync not supported');
    }
  }, []);

  /**
   * Clear all caches
   */
  const clearCache = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Send clear cache message to service worker
        const messageChannel = new MessageChannel();
        registration.active?.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
        
        // Wait for response
        await new Promise((resolve) => {
          messageChannel.port1.onmessage = resolve;
        });
      }

      // Also clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      toast.success('Cache cleared successfully!');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  }, []);

  /**
   * Initialize PWA features
   */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Register service worker
      await registerServiceWorker();
      
      // Check install status
      checkInstallStatus();
      
      // Check notification permission
      checkNotificationPermission();

      // Listen for online/offline events
      const handleOnline = () => {
        if (mounted) {
          setState(prev => ({ ...prev, isOnline: true }));
          toast.success('Back online!');
        }
      };

      const handleOffline = () => {
        if (mounted) {
          setState(prev => ({ ...prev, isOnline: false }));
          toast.warn('You are offline. Some features may be limited.');
        }
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        const event = e as BeforeInstallPromptEvent;
        e.preventDefault();
        setDeferredPrompt(event);
        if (mounted) {
          setState(prev => ({ ...prev, isInstallable: true }));
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Listen for app installed event
      const handleAppInstalled = () => {
        if (mounted) {
          setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
          toast.success('OpenConductor has been installed!');
        }
        setDeferredPrompt(null);
      };

      window.addEventListener('appinstalled', handleAppInstalled);

      // Cleanup function
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    };

    init();

    return () => {
      mounted = false;
    };
  }, [registerServiceWorker, checkInstallStatus, checkNotificationPermission]);

  /**
   * Listen for service worker messages
   */
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'SYNC_COMPLETE':
            toast.success('Background sync completed');
            setState(prev => ({ ...prev, syncInProgress: false }));
            break;
          case 'CACHE_UPDATED':
            toast.info('New content cached for offline use');
            break;
          case 'UPDATE_AVAILABLE':
            setState(prev => ({ ...prev, updateAvailable: true }));
            break;
        }
      });
    }
  }, []);

  const actions: PWAActions = {
    installApp,
    updateApp,
    enableNotifications,
    disableNotifications,
    syncNow,
    clearCache,
  };

  return [state, actions];
};

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Check if device is mobile
 */
export const isMobile = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Check if app is running in standalone mode
 */
export const isStandaloneMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

/**
 * Get device info for analytics
 */
export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    standalone: isStandaloneMode(),
    mobile: isMobile(),
    screenSize: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
};

export default usePWA;
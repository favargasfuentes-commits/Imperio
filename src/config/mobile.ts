/**
 * CONFIGURACIÓN MÓVIL
 *
 * Este archivo contiene la configuración necesaria para optimizar
 * la aplicación como una Progressive Web App (PWA) móvil.
 */

export const mobileConfig = {
  // Meta tags que deben estar en el HTML
  metaTags: {
    viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover',
    themeColor: '#6366f1',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black-translucent',
    appleMobileWebAppTitle: 'Finanzas',
    formatDetection: 'telephone=no',
  },

  // Configuración PWA
  pwa: {
    name: 'Gestor Financiero de Pareja',
    shortName: 'Finanzas',
    description: 'Aplicación para gestionar finanzas de pareja con gastos, ahorros y metas',
    themeColor: '#6366f1',
    backgroundColor: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    startUrl: '/',
    scope: '/',
  },

  // Breakpoints responsive
  breakpoints: {
    mobile: 640,      // 640px - pantallas pequeñas
    tablet: 768,      // 768px - tablets
    desktop: 1024,    // 1024px - desktop pequeño
    wide: 1280,       // 1280px - desktop grande
  },

  // Tamaños táctiles mínimos (iOS HIG)
  touchTargets: {
    minimum: 44,      // 44px - mínimo recomendado por Apple
    comfortable: 48,  // 48px - tamaño confortable
    large: 56,        // 56px - tamaño grande
  },

  // Configuración de gestos
  gestures: {
    swipeThreshold: 50,     // Píxeles mínimos para detectar swipe
    longPressDelay: 500,    // ms para long press
    doubleTapDelay: 300,    // ms entre taps para double tap
  },

  // Offline
  offline: {
    enabled: true,
    cacheName: 'financial-app-v1',
    cacheUrls: [
      '/',
      '/src/app/App.tsx',
      '/src/styles/theme.css',
    ],
  },
};

// Detectar si estamos en móvil
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Detectar si estamos en iOS
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;

  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// Detectar si estamos en Android
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;

  return /Android/i.test(navigator.userAgent);
};

// Detectar si estamos en modo standalone (instalada como PWA)
export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

// Prevenir el zoom en iOS cuando se hace focus en inputs
export const preventIOSZoom = () => {
  if (isIOS()) {
    const addMaximumScaleToMetaViewport = () => {
      const el = document.querySelector('meta[name=viewport]');

      if (el !== null) {
        let content = el.getAttribute('content') || '';
        const re = /maximum\-scale=[0-9\.]+/g;

        if (re.test(content)) {
          content = content.replace(re, 'maximum-scale=1.0');
        } else {
          content = [content, 'maximum-scale=1.0'].join(', ');
        }

        el.setAttribute('content', content);
      }
    };

    const disableIOSTextFieldZoom = addMaximumScaleToMetaViewport;

    // Disable auto-zoom on focus
    const checkIsIOS = () =>
      /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (checkIsIOS()) {
      disableIOSTextFieldZoom();
    }
  }
};

// Configurar la aplicación para móvil
export const setupMobileApp = () => {
  // Prevenir zoom en iOS
  preventIOSZoom();

  // Agregar clase al body si es móvil
  if (isMobile()) {
    document.body.classList.add('is-mobile');
  }

  if (isIOS()) {
    document.body.classList.add('is-ios');
  }

  if (isAndroid()) {
    document.body.classList.add('is-android');
  }

  if (isStandalone()) {
    document.body.classList.add('is-standalone');
  }

  // Prevenir pull-to-refresh en Chrome mobile
  let lastTouchY = 0;
  let preventPullToRefresh = false;

  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      lastTouchY = e.touches[0].clientY;
      preventPullToRefresh = window.pageYOffset === 0;
    },
    { passive: false }
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      const touchY = e.touches[0].clientY;
      const touchYDelta = touchY - lastTouchY;
      lastTouchY = touchY;

      if (preventPullToRefresh && touchYDelta > 0) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevenir comportamiento por defecto de toques largos (context menu)
  window.addEventListener('contextmenu', (e) => {
    if (isMobile()) {
      e.preventDefault();
    }
  });
};

// Función para registrar el service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && mobileConfig.offline.enabled) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      return null;
    }
  }
  return null;
};

// Función para instalar la app (PWA)
export const promptInstall = () => {
  // Esta función se debe llamar desde un evento de usuario (click)
  const deferredPrompt = (window as any).deferredPrompt;

  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuario aceptó instalar la app');
      } else {
        console.log('Usuario rechazó instalar la app');
      }
      (window as any).deferredPrompt = null;
    });
  }
};

// Escuchar evento de instalación
export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).deferredPrompt = e;
    console.log('💾 App lista para instalar');
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ App instalada correctamente');
    (window as any).deferredPrompt = null;
  });
};

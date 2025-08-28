import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/react-start';
import { createRouter } from './router';
import { startTransition } from 'react';

// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Initialize performance monitoring for hydration
function initializeHydrationMonitoring() {
  if (typeof window !== 'undefined') {
    // Track hydration start time
    performance.mark('hydration-start');

    // Monitor Core Web Vitals
    if ('web-vitals' in window) {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS(console.log);
        onFID(console.log);
        onFCP(console.log);
        onLCP(console.log);
        onTTFB(console.log);
      });
    }
  }
}

// Enhanced error boundary for hydration errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleHydrationError(error: unknown, _errorInfo?: any) {
  console.error('Hydration Error:', error);

  // Track hydration errors for monitoring
  if (typeof window !== 'undefined' && window.gtag) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    window.gtag('event', 'hydration_error', {
      error_message: errorMessage,
      error_stack: errorStack,
    });
  }

  // Attempt graceful recovery
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes('hydration')) {
    console.warn('Attempting hydration recovery...');

    // Clear the problematic content and re-render
    setTimeout(() => {
      const root = document.getElementById('root') || document.body;
      if (root) {
        root.innerHTML = '';
        // Re-attempt hydration with fresh state
        initializeApp();
      }
    }, 100);
  }
}

function initializeApp() {
  try {
    initializeHydrationMonitoring();

    const router = createRouter();

    // Use React 19 concurrent features for progressive hydration
    startTransition(() => {
      hydrateRoot(document, <StartClient router={router} />, {
        // React 19 hydration options
        onRecoverableError: handleHydrationError,
        identifierPrefix: 'app-',
      });

      // Track successful hydration
      if (typeof window !== 'undefined') {
        performance.mark('hydration-end');
        performance.measure(
          'hydration-duration',
          'hydration-start',
          'hydration-end'
        );

        // Report hydration metrics
        const hydrationMeasure =
          performance.getEntriesByName('hydration-duration')[0];
        if (hydrationMeasure) {
          console.log(`Hydration completed in ${hydrationMeasure.duration}ms`);

          // Track in analytics if available
          if (window.gtag) {
            window.gtag('event', 'hydration_complete', {
              duration: hydrationMeasure.duration,
            });
          }
        }
      }
    });
  } catch (error) {
    handleHydrationError(error as Error);
  }
}

// Enhanced hydration with retry logic
function hydrateWithRetry(maxRetries = 3) {
  let retryCount = 0;

  function attemptHydration() {
    try {
      initializeApp();
    } catch (error) {
      retryCount++;

      if (retryCount < maxRetries) {
        console.warn(`Hydration attempt ${retryCount} failed, retrying...`);

        // Exponential backoff for retries
        setTimeout(
          () => {
            attemptHydration();
          },
          Math.pow(2, retryCount) * 1000
        );
      } else {
        console.error('Max hydration retries exceeded');
        handleHydrationError(error as Error);
      }
    }
  }

  attemptHydration();
}

// Check if we need to wait for critical resources
function waitForCriticalResources(): Promise<void> {
  return new Promise((resolve) => {
    // Wait for fonts and critical CSS to load
    if (document.fonts) {
      document.fonts.ready.then(() => {
        // Additional check for critical CSS
        const criticalStylesheets = document.querySelectorAll(
          'link[rel="stylesheet"][data-critical]'
        );
        if (criticalStylesheets.length > 0) {
          Promise.all(
            Array.from(criticalStylesheets).map((link) => {
              return new Promise((resolveLink) => {
                if ((link as HTMLLinkElement).sheet) {
                  resolveLink(void 0);
                } else {
                  link.addEventListener('load', () => resolveLink(void 0));
                }
              });
            })
          ).then(() => resolve());
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// Initialize hydration based on page visibility and network conditions
function smartHydrationInit() {
  if (typeof window === 'undefined') return;

  // Check if page is visible
  if (document.visibilityState === 'visible') {
    // Check network conditions if available
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection && connection.saveData) {
      // Defer hydration for users on data-saver mode
      console.log('Data saver mode detected, deferring hydration');
      requestIdleCallback(() => {
        waitForCriticalResources().then(() => {
          hydrateWithRetry();
        });
      });
    } else {
      // Normal hydration
      waitForCriticalResources().then(() => {
        hydrateWithRetry();
      });
    }
  } else {
    // Wait for page to become visible
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'visible') {
          waitForCriticalResources().then(() => {
            hydrateWithRetry();
          });
        }
      },
      { once: true }
    );
  }
}

// Start the app
smartHydrationInit();

// Registers the offline service worker (public/sw.js is copied to the build root).
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch((err) => console.warn('ScadaSteps: service worker registration failed', err));
  });
}

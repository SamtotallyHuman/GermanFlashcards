// src/serviceWorkerRegistration.js
import { Workbox } from 'workbox-window';

export function registerServiceWorker(onUpdateFound) {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/service-worker.js');

    wb.addEventListener('installed', event => {
      // event.isUpdate === true when a new SW is installed over an older one
      if (event.isUpdate) {
        console.log('New content is available; please refresh.');
        if (typeof onUpdateFound === 'function') onUpdateFound();
      } else {
        console.log('Content is cached for offline use.');
      }
    });

    wb.register().catch(err => console.error('SW registration failed:', err));
  } else {
    console.log('Service workers are not supported in this browser.');
  }
}

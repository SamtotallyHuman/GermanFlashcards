// scripts/build-sw.js
const { generateSW } = require('workbox-build');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const pkg = require('../package.json');
const homepagePath = pkg.homepage ? new URL(pkg.homepage).pathname : '/';
const navigateFallbackURL = `${homepagePath.replace(/\/$/, '')}/index.html`;

generateSW({
  globDirectory: buildDir,
  globPatterns: [
    '**/*.{html,js,css,png,svg,jpg,jpeg,ico,json,woff2,woff,ttf}'
  ],
  swDest: path.join(buildDir, 'service-worker.js'),
  clientsClaim: true,
  navigateFallback: navigateFallbackURL,
  skipWaiting: true,
  navigateFallback: '/index.html',
  runtimeCaching: [
    {
      // Cache API GET requests (tweak the urlPattern to match your API)
      urlPattern: /\/api\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache-v1',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60 // 1 day
        },
        networkTimeoutSeconds: 5
      }
    },
    {
      // Images: cache-first with expiration
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache-v1',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
}).then(({ count, size, warnings }) => {
  warnings.forEach(w => console.warn(w));
  console.log(`Service worker generated. Precached ${count} files, ${size} bytes.`);
}).catch(err => {
  console.error('Workbox build failed:', err);
  process.exit(1);
});

// add to scripts/build-sw.js after generateSW() resolves
const fs = require('fs');
fs.copyFileSync(path.join(buildDir, 'index.html'), path.join(buildDir, '404.html'));

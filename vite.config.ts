import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'assets/logo.png', 'robots.txt'],
      manifest: {
        name: 'AllyTZ Panel - Trading Signals & Education',
        short_name: 'AllyTZ Panel',
        description: 'Professional forex trading signals, analysis, courses and mentorship platform',
        theme_color: '#F4C464',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        // screenshots: [
        //   {
        //     src: '/screenshot-wide.png',
        //     sizes: '1280x720',
        //     type: 'image/png',
        //     form_factor: 'wide',
        //     label: 'AllyTZ Panel Dashboard'
        //   },
        //   {
        //     src: '/screenshot-mobile.png',
        //     sizes: '750x1334',
        //     type: 'image/png',
        //     form_factor: 'narrow',
        //     label: 'AllyTZ Panel Mobile'
        //   }
        // ],
        categories: ['finance', 'education'],
        shortcuts: [
          {
            name: 'Signals',
            short_name: 'Signals',
            description: 'View trading signals',
            url: '/dashboard/signals',
            icons: [{ src: '/assets/logo.png', sizes: '96x96' }]
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Open dashboard',
            url: '/dashboard',
            icons: [{ src: '/assets/logo.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        // Cache strategy for assets
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/iurstpwtdnlmpvwyhqfn\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        // Files to precache
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Maximum size of files to precache (2mb)
        maximumFileSizeToCacheInBytes: 3000000
      },
      devOptions: {
        enabled: false, // Set to true to test PWA in dev mode
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared')
    },
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion']
  }
})
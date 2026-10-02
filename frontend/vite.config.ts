import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { iconNames } from 'lucide-react/dynamic'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'LoyalCard - Loyalty Platform',
        short_name: 'LoyalCard',
        description: 'Digital loyalty platform without native app',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // lucide-react/dynamic code-splits every icon into its own chunk since
        // the icon name is only known at runtime. Precaching all ~1500 of them
        // (most of which a given tenant will never render) turned every first
        // visit and every app update into 1000+ background requests — let the
        // few actually used load lazily instead (the browser still caches them
        // normally from then on).
        globIgnores: ['**/node_modules/**/*', ...iconNames.map((name) => `**/assets/${name}-*.js`)],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src')
    }
  },
  server: {
    port: 3000,
    open: true,
    // Allows the loca.lt tunnel used for phone testing on the same wifi to reach the dev server
    allowedHosts: ['.loca.lt']
  }
})

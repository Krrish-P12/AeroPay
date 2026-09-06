import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AeroPay',
        short_name: 'AeroPay',
        display: 'fullscreen',
        theme_color: '#000000',
        background_color: '#000000',
        icons: [
          {
            src: '/favicon.svg', // Ensure you drop an SVG icon in the public folder
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
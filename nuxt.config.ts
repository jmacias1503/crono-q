import tailwindcss from "@tailwindcss/vite";
import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  build: {
    transpile: ['vue-barcode-reader']
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],
  modules: [
    "@nuxt/ui",
    "shadcn-nuxt",
    "@prisma/nuxt",
    "@scalar/nuxt",
    "@vite-pwa/nuxt",
  ],
  shadcn: {
    prefix: "",
    componentDir: "./app/components/ui",
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["reka-ui"],
    },
    resolve: {
      alias: {
	'.prisma/client/index-browser': './node_modules/.prisma/client/index-browser.js'
      }
    }
  },
  pwa: {
    strategies: "generateSW",
    registerType: "autoUpdate",
    workbox: {
      navigateFallback: "/",
      globPatterns: ["**/*.{js,css,html,txt,ico,png,svg,woff2}"],
      maximumFileSizeToCacheInBytes: 5000000,
    },
    manifest: {
      name: "Crono-Q",
      short_name: "Crono-Q",
      description: "A Progressive Web App built with Nuxt",
      theme_color: "#ffffff",
      lang: "en",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      orientation: "portrait",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
    },
  },
});

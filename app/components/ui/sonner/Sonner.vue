<script setup lang="ts">
import { Toaster as Sonner } from 'vue-sonner'

interface ToasterProps {
  invert?: boolean
  theme?: 'light' | 'dark' | 'system'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
  hotkey?: string[]
  richColors?: boolean
  expand?: boolean
  duration?: number
  gap?: number
  visibleToasts?: number
  closeButton?: boolean
  toastOptions?: {
    style?: Record<string, string>
    className?: string
    descriptionClassName?: string
    actionButtonStyle?: Record<string, string>
    cancelButtonStyle?: Record<string, string>
  }
  offset?: string | number
  dir?: 'rtl' | 'ltr' | 'auto'
}

withDefaults(defineProps<ToasterProps>(), {
  position: 'top-right',
  theme: 'system',
  expand: false,
  duration: 4000,
  visibleToasts: 5,
})
</script>

<template>
  <Sonner
    v-bind="$props"
    :toast-options="{
      ...toastOptions,
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
        border: '1px solid hsl(var(--border))',
        ...toastOptions?.style,
      },
    }"
  />
</template>

<style>
/* Asegurar que el contenedor de toasts esté visible y en la posición correcta */
[data-sonner-toaster] {
  position: fixed !important;
  z-index: 9999 !important;
  pointer-events: none !important;
}

[data-sonner-toaster][data-x-position="right"] {
  right: 0 !important;
}

[data-sonner-toaster][data-y-position="top"] {
  top: 0 !important;
}

[data-sonner-toast] {
  pointer-events: auto !important;
  background: hsl(var(--card)) !important;
  color: hsl(var(--card-foreground)) !important;
  border: 1px solid hsl(var(--border)) !important;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
}

[data-sonner-toast][data-type="success"] {
  background: hsl(142.1 76.2% 36.3%) !important;
  color: white !important;
  border-color: hsl(142.1 76.2% 36.3%) !important;
}

[data-sonner-toast][data-type="error"] {
  background: hsl(0 72.2% 50.6%) !important;
  color: white !important;
  border-color: hsl(0 72.2% 50.6%) !important;
}

[data-sonner-toast][data-type="warning"] {
  background: hsl(47.9 95.8% 53.1%) !important;
  color: hsl(0 0% 0%) !important;
  border-color: hsl(47.9 95.8% 53.1%) !important;
}
</style>

<script setup lang="ts">
import { Sonner } from '@/components/ui/sonner'
</script>

<template>
  <div class="w-full bg-background scroll-smooth min-h-screen flex flex-col">
    <Navbar />
    <Sonner position="top-right" />
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

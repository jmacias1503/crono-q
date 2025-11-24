<template>
  <main class="bg-background w-full min-h-screen">
    <header class="w-full bg-background content-center flex flex-col py-4">
      <img src="/CronoQLogo.svg" class="w-auto h-12" />
    </header>
    <slot />
  </main>
</template>

<script setup lang="ts">
// client-side cookie checks removed: rely on server middleware to validate HttpOnly session cookie
</script>

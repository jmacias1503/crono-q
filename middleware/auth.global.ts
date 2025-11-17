import { defineNuxtRouteMiddleware, navigateTo, useRequestHeaders } from '#app';

export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/', '/login', '/register'];
  if (publicRoutes.includes(to.path) || to.path.startsWith('/events')) return;

  try {
    if (process.server) {
      const headers = useRequestHeaders(['cookie']);
      await $fetch('/api/auth/me', { headers });
    } else {
      await $fetch('/api/auth/me', { credentials: 'include' });
    }
  } catch (err) {
    return navigateTo('/login');
  }
});
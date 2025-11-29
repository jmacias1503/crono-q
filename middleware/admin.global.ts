import { defineNuxtRouteMiddleware, navigateTo, useRequestHeaders } from '#app';

export default defineNuxtRouteMiddleware(async (to) => {
  
  // Solo aplicar en rutas /admi
  if (!to.path.startsWith('/admi')) {
    return;
  }


  try {
    let response;
    
    if (process.server) {
      const headers = useRequestHeaders(['cookie']);
      response = await $fetch('/api/auth/me', { headers });
    } else {
      response = await $fetch('/api/auth/me', { credentials: 'include' });
    }
    
    
    // Si no es admin, redirigir a login
    if (response.data.userType !== 'admin') {
      return navigateTo('/login');
    }
    
  } catch (error: any) {
    // Si no está autenticado o hay error, redirigir a login
    return navigateTo('/login');
  }
});
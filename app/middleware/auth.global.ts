export default defineNuxtRouteMiddleware(async (to) => {

  // Rutas completamente públicas (no requieren autenticación)
  const publicRoutes = ['/', '/login', '/register'];
  
  if (publicRoutes.includes(to.path)) {
    return;
  }

  // Verificar autenticación
  
  try {
    let userData;
    
    if (process.server) {
      // En servidor, pasar cookies manualmente
      const headers = useRequestHeaders(['cookie']);
      
      const response = await $fetch('/api/auth/me', { 
        headers,
        redirect: 'manual'
      });
      userData = response.data;
    } else {
      // En cliente, las cookies se envían automáticamente
      const response = await $fetch('/api/auth/me', { 
        credentials: 'include' 
      });
      userData = response.data;
    }


    // PROTECCIÓN DE RUTAS ADMIN
    if (to.path.startsWith('/admi')) {
      if (userData.userType !== 'admin') {
        return navigateTo('/login');
      }
      return;
    }

    // PROTECCIÓN DE RUTAS USER
    if (to.path.startsWith('/user')) {
      if (userData.userType !== 'student') {
        return navigateTo('/login');
      }
      return;
    }

    // Otras rutas autenticadas
    
  } catch (error: any) {
    
    // Si hay error de autenticación, redirigir a login
    // PERO solo si no estamos ya en una ruta pública
    if (!publicRoutes.includes(to.path)) {
      return navigateTo('/login');
    }
  }
});
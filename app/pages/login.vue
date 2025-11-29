<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import type { FetchError } from "ofetch";
import { toast } from "vue-sonner";
import { loginSchema, type LoginForm } from "~/schemas/LoginSchema";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

definePageMeta({
  layout: "landing",
});

const formSchema = toTypedSchema(loginSchema);

// Campo único para ID (puede ser student_id o admin_id)
const userId = ref<number | undefined>(undefined);
const password = ref("");

const isSubmitting = ref(false);
const fieldErrors = ref<Record<string, string>>({});

// overlay / redirect state
const isRedirecting = ref(false);
const redirectMessage = ref("Iniciando sesión. Cargando dashboard...");

onMounted(async () => {
  // if the user already has a valid session cookie, /api/auth/me will return user data
  try {
    const me = await $fetch('/api/auth/me', { method: 'GET', credentials: 'include' });
    
    if (me.data.userType === 'admin') {
      await navigateTo('/admi');
    } else {
      await navigateTo('/user');
    }
  } catch (e) {
    // not authenticated — do nothing and let the user log in
  }
});

function onFieldBlur(componentField: any) {
  try {
    const val = componentField.value;
    if (typeof val === "string") {
      componentField.value = val.trim();
    }
  } catch (e) {
    // ignore
  }
}

const onSubmit = async () => {
  if (!userId.value || !password.value) {
    fieldErrors.value = {};
    if (!userId.value) fieldErrors.value.userId = 'El ID es requerido';
    if (!password.value) fieldErrors.value.password = 'La contraseña es requerida';
    toast.warning('Campos incompletos', { description: 'Completa todos los campos.' });
    return;
  }

  isSubmitting.value = true;
  fieldErrors.value = {};
  const trimmedPassword = password.value.trim();
  const numericId = Number(userId.value);


  // Intentar primero como estudiante
  try {
    const studentPayload = {
      userType: 'student' as const,
      student_id: numericId,
      password: trimmedPassword,
    };

    await $fetch('/api/auth/login', {
      method: 'POST',
      body: studentPayload,
    });

    // Si llega aquí, el login fue exitoso
    await handleSuccessfulLogin();
    return;
  } catch (studentErr) {
    
    // Si falla como estudiante, intentar como admin
    try {
      const adminPayload = {
        userType: 'admin' as const,
        admin_id: numericId,
        password: trimmedPassword,
      };

      await $fetch('/api/auth/login', {
        method: 'POST',
        body: adminPayload,
      });

      // Si llega aquí, el login fue exitoso
      await handleSuccessfulLogin();
      return;
    } catch (adminErr) {
      isSubmitting.value = false;
      
      // Mostrar error genérico
      fieldErrors.value = { userId: 'Credenciales incorrectas' };
      toast.error('Credenciales incorrectas', { 
        description: 'Verifica tu ID y contraseña.' 
      });
    }
  }
};

const handleSuccessfulLogin = async () => {
  try {
    isRedirecting.value = true;
    redirectMessage.value = 'Inicio de sesión correcto. Validando sesión...';

    const me = await $fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });

    await new Promise((r) => setTimeout(r, 600));

    // Redirigir según tipo de usuario
    if (me.data.userType === 'admin') {
      await navigateTo('/admi');
    } else {
      await navigateTo('/user');
    }
  } catch (e) {
    isRedirecting.value = false;
    isSubmitting.value = false;
    toast.error('No se pudo validar la sesión. Intenta de nuevo.');
    console.error('Error al validar /api/auth/me después de login', e);
  }
};
</script>

<template>
  <div
    class="w-full flex flex-col justify-center items-center text-foreground text-4xl gap-8 h-[80vh]"
  >
    <h1 class="font-medium">Iniciar Sesión</h1>

    <form
      class="space-y-6 w-1/2 justify-center flex flex-col items-center"
      novalidate
      @submit.prevent="onSubmit"
    >
      <div class="w-full">
        <Input
          v-model="userId"
          type="number"
          inputmode="numeric"
          placeholder="Ingresa tu expediente"
          class="no-spinner"
          :class="{ 'border-red-500': fieldErrors.userId }"
        />
        <p v-if="fieldErrors.userId" class="text-sm text-red-500 mt-1">{{ fieldErrors.userId }}</p>
      </div>

      <div class="w-full">
        <Input
          v-model="password"
          type="password"
          placeholder="Ingresa tu contraseña"
          :class="{ 'border-red-500': fieldErrors.password }"
        />
        <p v-if="fieldErrors.password" class="text-sm text-red-500 mt-1">{{ fieldErrors.password }}</p>
      </div>

      <Button type="submit" class="w-1/2 text-xl" variant="secondary" :disabled="isSubmitting">
        <span v-if="isSubmitting">Iniciando sesión...</span>
        <span v-else>Ingresar</span>
      </Button>
    </form>

    <div v-if="isRedirecting" class="register-overlay" aria-hidden="false">
      <div class="overlay-content">
        <div class="spinner">
          <div></div><div></div><div></div>
        </div>
        <div class="overlay-text">{{ redirectMessage }}</div>
      </div>
    </div>
  </div>
</template>


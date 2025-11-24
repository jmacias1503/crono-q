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

// initial values: default userType to student
const { handleSubmit, setErrors, isSubmitting } = useForm<LoginForm>({
  validationSchema: formSchema,
  initialValues: {
    userType: "student",
    student_id: undefined,
    admin_id: undefined,
    password: "",
  } as Partial<LoginForm>,
});

// overlay / redirect state
const isRedirecting = ref(false);
const redirectMessage = ref("Iniciando sesión. Cargando dashboard...");

onMounted(async () => {
  // if the user already has a valid session cookie, /api/auth/me will return user data
  try {
    await $fetch('/api/auth/me', { method: 'GET', credentials: 'include' });
    await navigateTo('/user');
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

const onSubmit = handleSubmit(async (values: LoginForm) => {
  const payload = { ...values } as any;
  if (typeof payload.password === "string") payload.password = payload.password.trim();

  if (payload.userType === "student" && typeof payload.student_id === "number") {
    if (String(Math.abs(payload.student_id)).length > 7) {
      setErrors({ student_id: "El número de control no puede exceder 7 dígitos." } as any);
      toast.warning("Revisa el expediente", { description: "El expediente debe tener máximo 7 dígitos." });
      return;
    }
  }

  console.log("📝 Intentando login...", payload);

  try {
    // POST login (server will set HttpOnly cookie)
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: payload,
    });

    // validate server session by calling /api/auth/me (ensure cookie is sent)
    try {
      isRedirecting.value = true;
      redirectMessage.value = 'Inicio de sesión correcto. Validando sesión...';

      const me = await $fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      // small delay for UX
      await new Promise((r) => setTimeout(r, 600));

      // if /me resolved, go to dashboard
      await navigateTo('/user');
    } catch (e) {
      // if /me failed, clear overlay and show error
      isRedirecting.value = false;
      toast.error('No se pudo validar la sesión. Intenta de nuevo.');
      console.error('Error al validar /api/auth/me después de login', e);
    }
  } catch (err) {
    console.log('❌ Error en login:', err);
    const error = err as FetchError<{
      message?: string;
      data?: { path?: (string | number)[]; message: string }[];
    }>;

    const fieldIssues = error?.data?.data;
    if (Array.isArray(fieldIssues) && fieldIssues.length > 0) {
      const fieldErrors = fieldIssues.reduce<Record<string, string>>((acc, issue) => {
        const field = issue.path?.[0];
        if (typeof field === 'string') acc[field] = issue.message;
        return acc;
      }, {});
      setErrors(fieldErrors as any);
      // show a toast summary
      toast.warning('Credenciales inválidas', { description: 'Revisa los campos marcados.' });
      return;
    }

    // server/general error: show toast
    toast.error('No se pudo iniciar sesión', { description: error?.data?.message ?? 'Inténtalo más tarde.' });
  }
});
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
      <FormField v-slot="{ componentField }" name="student_id" class="w-full">
        <FormItem class="w-full">
          <FormControl>
            <Input
              type="text"
              inputmode="numeric"
              pattern="\d*"
              maxlength="7"
              placeholder="Ingresa tu expediente"
              v-bind="componentField"
              class="no-spinner"
              @blur="() => onFieldBlur(componentField)"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="password" class="w-full">
        <FormItem class="w-full">
          <FormControl>
            <Input
              type="password"
              v-bind="componentField"
              placeholder="Ingresa tu clave de acceso"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

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


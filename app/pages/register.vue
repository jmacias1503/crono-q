<script setup lang="ts">
import { ref } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import type { FetchError } from "ofetch";
import { toast } from "vue-sonner";
import {
  registrationSchema,
  type RegistrationForm,
} from "~/schemas/RegistrationSchema";

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

const formSchema = toTypedSchema(registrationSchema);

const { handleSubmit, setErrors, isSubmitting, resetForm } = useForm<RegistrationForm>({
  validationSchema: formSchema,
  initialValues: {
    student_id: undefined,
    first_name: "",
    last_name: "",
    career: "",
    semester: undefined,
    password: "",
  } as Partial<RegistrationForm>,
});

// overlay / redirect state
const isRedirecting = ref(false);
const redirectMessage = ref("Redirigiendo a iniciar sesión...");

const onSubmit = handleSubmit(async (values: RegistrationForm) => {
  const cleaned: Partial<RegistrationForm> = { ...values };
  Object.keys(cleaned).forEach((k) => {
    const key = k as keyof RegistrationForm;
    const v = cleaned[key] as unknown;
    if (typeof v === "string") cleaned[key] = (v as string).trim() as any;
  });

  const sid = cleaned.student_id ?? values.student_id;
  if (typeof sid === "number" && String(Math.abs(sid)).length > 7) {
    setErrors({ student_id: "El número de control no puede exceder 7 dígitos." });
    toast.warning("Revisa el expediente", { description: "El expediente debe tener máximo 7 dígitos." });
    return;
  }

  try {
    const response = await $fetch("/api/auth/signup", {
      method: "POST",
      body: cleaned,
    });
    
    toast.success("¡Registro completo!", {
      description: "Tu cuenta fue creada correctamente.",
    });

    isRedirecting.value = true;
    redirectMessage.value = "Registro exitoso. Preparando tu sesión...";

    await new Promise((r) => setTimeout(r, 1400));

    // navegar a la página de login
    await navigateTo('/login');

    resetForm();
  } catch (err) {
    
    const error = err as FetchError<{
      message?: string;
      data?: { path?: (string | number)[]; message: string }[];
    }>;

    const fieldIssues = error?.data?.data;

    if (Array.isArray(fieldIssues) && fieldIssues.length > 0) {
      const fieldErrors = fieldIssues.reduce<Record<string, string>>(
        (acc, issue) => {
          const field = issue.path?.[0];
          if (typeof field === "string") {
            acc[field] = issue.message;
          }
          return acc;
        },
        {}
      );

      setErrors(fieldErrors);

      toast.warning("Revisa el formulario", {
        description: "Corrige los campos marcados e inténtalo de nuevo.",
      });
      return;
    }

    toast.error("No se pudo registrar", {
      description: error?.data?.message ?? "Inténtalo más tarde.",
    });
  }
});
</script>
<template>
  <div
    class="w-full flex flex-col justify-center items-center text-foreground text-4xl px-18 gap-8 h-[80vh]"
  >
    <h1>Regístrate</h1>
    <form
      class="space-y-6 w-2/3 justify-center flex flex-col items-center"
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
              @blur="() => onFieldBlur(componentField)"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="first_name" class="w-full">
        <FormItem class="w-full">
          <FormControl>
            <Input
              type="text"
              placeholder="Ingresa tu nombre"
              v-bind="componentField"
              @blur="() => onFieldBlur(componentField)"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="last_name">
        <FormItem class="w-full">
          <FormControl>
            <Input
              type="text"
              placeholder="Ingresa tus apellidos"
              v-bind="componentField"
              @blur="() => onFieldBlur(componentField)"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <div class="w-full flex flex-row gap-8">
        <FormField v-slot="{ componentField }" name="career" class="w-full">
          <FormItem class="w-full">
            <FormControl>
              <Input
                type="text"
                placeholder="Ingresa tu carrera"
                v-bind="componentField"
                @blur="() => onFieldBlur(componentField)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="semester" class="w-full">
          <FormItem class="w-50">
            <FormControl>
              <Input
                type="number"
                placeholder="Semestre"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <FormField v-slot="{ componentField }" name="password">
        <FormItem class="w-full">
          <FormControl>
            <Input
              type="password"
              v-bind="componentField"
              placeholder="Ingresa tu contraseña"
              @blur="() => onFieldBlur(componentField)"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button
        type="submit"
        class="w-1/2 text-xl"
        variant="secondary"
        :disabled="isSubmitting"
      >
        <span v-if="isSubmitting">Registrando...</span>
        <span v-else class="cursor-pointer">Registrarse</span>
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
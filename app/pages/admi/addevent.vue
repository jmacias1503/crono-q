<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";

import { Button } from "~/components/ui/button";
import { toast } from 'vue-sonner';
import type { FetchError } from 'ofetch';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { ArrowLeft } from "lucide-vue-next";
import { eventSchema, type EventForm } from "~/schemas/EventSchema";
import TimeInput from "~/components/ui/timepicker/time-input.vue";
import { DatePicker } from "~/components/ui/datepicker";

const formSchema = toTypedSchema(eventSchema);

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit(async (values: EventForm) => {
  const payload = { ...values } as any;
  Object.keys(payload).forEach((k) => {
    const v = payload[k];
    if (typeof v === "string") payload[k] = v.trim();
  });

  // helper: combina day + time en ISO y valida
  function toISODateTime(day: string, time: string) {
    if (!day || !time) return null;
    // time puede ser "09:00" o "09:00:00" — asegurar segundos
    const t = time.length === 5 ? `${time}:00` : time;
    const iso = `${day}T${t}`;
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toISOString() : null;
  }

  const i_iso = toISODateTime(payload.day, payload.i_hour);
  const f_iso = toISODateTime(payload.day, payload.f_hour);
  const day_iso = (() => {
    const d = new Date(payload.day);
    return Number.isFinite(d.getTime()) ? d.toISOString() : null;
  })();

  if (!day_iso) {
    form.setErrors?.({ day: "Fecha inválida" });
    toast.warning("Fecha inválida", { description: "Verifica la fecha seleccionada." });
    return;
  }

  if (!i_iso || !f_iso) {
    const errs: Record<string,string> = {};
    if (!i_iso) errs.i_hour = "Hora de inicio inválida";
    if (!f_iso) errs.f_hour = "Hora de fin inválida";
    form.setErrors?.(errs as any);
    toast.warning("Hora inválida", { description: "Asegúrate de seleccionar una hora válida." });
    return;
  }

  // enviar ISO strings (Prisma en el server puede crear Date desde ISO)
  payload.day = day_iso;
  payload.i_hour = i_iso;
  payload.f_hour = f_iso;

  try {
    const res = await $fetch("/api/events", { method: "POST", body: payload });
    toast.success("Evento creado", { description: "El evento se ha añadido correctamente." });
    await navigateTo("/admi");
    toast.success('Evento creado', { description: 'El evento se ha añadido correctamente.' });
    await navigateTo('/admi');
  } catch (err) {
    console.error("Error creando evento:", err);
    const error = err as FetchError<{ message?: string; data?: { path?: (string|number)[]; message: string }[] }>;
    const fieldIssues = error?.data?.data;
    if (Array.isArray(fieldIssues) && fieldIssues.length > 0) {
      const fieldErrors = fieldIssues.reduce<Record<string,string>>((acc, issue) => {
        const field = issue.path?.[0];
        if (typeof field === 'string') acc[field] = issue.message;
        return acc;
      }, {});
      form.setErrors?.(fieldErrors as any);
      toast.warning('Revisa el formulario', { description: 'Corrige los campos marcados.' });
      return;
    }

    toast.error('No se pudo crear el evento', { description: error?.data?.message ?? 'Inténtalo más tarde.' });
  }
});
</script>

<template>
  <div class="flex flex-row gap-2 justify-center w-full relative">
    <div class="flex absolute left-0">
      <NuxtLink to="/admi">
        <Button variant="ghost" class="text-secondary rounded-full">
          <ArrowLeft />
        </Button>
      </NuxtLink>
    </div>

    <h1 class="text-secondary text-4xl text-center">Añadir evento</h1>
  </div>

  <div
    class="w-full flex flex-col justify-center items-center mt-12 text-foreground h-[80vh]"
  >
    <form
      class="space-y-6 w-1/2 justify-center flex flex-col items-center"
      novalidate
      @submit.prevent="onSubmit"
    >
      <FormField v-slot="{ componentField }" name="event_name" class="w-full">
        <FormItem class="w-full">
          <FormControl>
            <Input
              type="text"
              placeholder="Ingrese el nombre del evento"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="location" class="w-full">
        <FormItem class="w-full">
          <FormControl>
            <Input
              type="text"
              placeholder="Ingrese la ubicación del evento"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="day" class="w-full">
        <FormItem class="w-full">
          <FormControl>
            <DatePicker v-bind="componentField" name="day" label="Fecha" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <div class="grid grid-cols-2 gap-4 w-full">
        <FormField v-slot="{ componentField }" name="i_hour" class="w-full">
          <FormItem class="w-full">
            <FormLabel class="text-foreground">Hora de inicio</FormLabel>
            <FormControl>
              <TimeInput v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="f_hour" class="w-full">
          <FormItem class="w-full">
            <FormLabel class="text-foreground">Hora de termino</FormLabel>
            <FormControl>
              <TimeInput v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <Button type="submit" class="w-1/2 text-xl" variant="secondary">
        Añadir Evento
      </Button>
    </form>
  </div>
</template>

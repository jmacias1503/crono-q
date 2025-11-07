<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";

import { Button } from "~/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import DatePicker from "~/components/ui/datepicker/date-picker.vue";
import TimeInput from "~/components/ui/timepicker/time-input.vue";
import { ArrowLeft } from "lucide-vue-next";
import { eventSchema, type EventForm } from "~/schemas/EventSchema";
import { toast } from "vue-sonner";

const formSchema = toTypedSchema(eventSchema);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    event_name: "",
    location: "",
    day: "",
    i_hour: "",
    f_hour: "",
  } as Partial<EventForm>,
});

const route = useRoute();
const router = useRouter();

const eventId = String(route.query.eventId ?? "");

// helper to format ISO -> date and time inputs
function isoToDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
function isoToTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toTimeString().slice(0, 5);
}

onMounted(async () => {
  if (!eventId) return;
  try {
    const res = await $fetch(`/api/events/${eventId}`);
    const ev = res?.event;
    if (!ev) return;
    form.resetForm({
      values: {
        event_name: ev.event_name,
        location: ev.location,
        day: isoToDate(ev.day),
        i_hour: isoToTime(ev.i_hour),
        f_hour: isoToTime(ev.f_hour),
      },
    });
  } catch (e) {
    console.error("Failed to load event:", e);
    toast.error("No se pudo cargar el evento");
  }
});

const onSubmit = form.handleSubmit(async (values: EventForm) => {
  // show updating overlay
  isUpdating.value = true;
  updatingMessage.value = 'Actualizando evento...';
  // normalize date+time to ISO
  function toISODateTime(dateStr: string, timeStr: string) {
    if (!dateStr || !timeStr) return null;
    const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    const iso = `${dateStr}T${time}`;
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toISOString() : null;
  }

  const payload: any = { ...values };
  const dayIso = (() => {
    const d = new Date(values.day);
    return Number.isFinite(d.getTime()) ? d.toISOString() : null;
  })();
  const iIso = toISODateTime(values.day, values.i_hour as string);
  const fIso = toISODateTime(values.day, values.f_hour as string);

  if (!dayIso || !iIso || !fIso) {
    toast.warning("Fechas/horas inválidas", { description: "Verifica los campos de fecha y hora." });
    isUpdating.value = false;
    return;
  }

  payload.day = dayIso;
  payload.i_hour = iIso;
  payload.f_hour = fIso;

  try {
    await $fetch(`/api/events/${eventId}`, { method: 'PUT', body: payload });
    toast.success('Evento actualizado', { description: 'Los cambios se guardaron correctamente.' });
    updatingMessage.value = 'Evento actualizado. Redirigiendo...';
    // small delay so user sees the success state
    await new Promise((r) => setTimeout(r, 1000));
    await router.push('/admi');
  } catch (err) {
    console.error('Error updating event:', err);
    const error = err as any;
    const fieldIssues = error?.data?.data;
    if (Array.isArray(fieldIssues)) {
      const fieldErrors = fieldIssues.reduce<Record<string,string>>((acc, issue) => {
        const field = issue.path?.[0];
        if (typeof field === 'string') acc[field] = issue.message;
        return acc;
      }, {});
      form.setErrors?.(fieldErrors as any);
      toast.warning('Revisa el formulario', { description: 'Corrige los campos marcados.' });
      isUpdating.value = false;
      return;
    }

    toast.error('No se pudo actualizar el evento', { description: error?.data?.message ?? 'Inténtalo más tarde.' });
    // hide overlay on error
    isUpdating.value = false;
  }
});

const isUpdating = ref(false);
const updatingMessage = ref('');
</script>

<template>
  <div class="flex flex-col w-full min-h-full gap-8">
    <div class="flex flex-row gap-2 justify-center w-full relative">
      <div class="flex absolute left-0">
        <NuxtLink to="/admi">
          <Button variant="ghost" class="text-secondary rounded-full">
            <ArrowLeft />
          </Button>
        </NuxtLink>
      </div>

      <h1 class="text-secondary text-4xl text-center">Editar Evento</h1>
    </div>

    <div class="w-full h-[80vh] flex justify-center items-center">
      <form
        class="space-y-6 md:w-1/2 justify-center flex flex-col items-center h-full"
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
              <FormControl>
                <TimeInput v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="f_hour" class="w-full">
            <FormItem class="w-full">
              <FormControl>
                <TimeInput v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <Button type="submit" class="w-1/2 text-xl" variant="secondary">
          Actualizar Evento
        </Button>
      </form>
    </div>
    <div v-if="isUpdating" class="register-overlay" aria-hidden="false">
      <div class="overlay-content">
        <div class="spinner">
          <div></div><div></div><div></div>
        </div>
        <div class="overlay-text">{{ updatingMessage }}</div>
      </div>
    </div>
  </div>
</template>

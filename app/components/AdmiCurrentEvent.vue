<script setup lang="ts">
import { MapPin } from "lucide-vue-next";
import type { CurrentEvent } from "~/types/admi-events";
import { ref } from 'vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  eventData: CurrentEvent & { eventCode?: string };
}>();

const isFinishing = ref(false);
const finishingMessage = ref('');
const showConfirm = ref(false);

const finishEventConfirm = async () => {
  showConfirm.value = false;
  if (!props.eventData || !props.eventData.eventId) return;
  isFinishing.value = true;
  finishingMessage.value = 'Terminando evento...';
    try {
    await $fetch(`/api/events/${props.eventData.eventId}`, { method: 'PATCH', body: { status: false } });
    finishingMessage.value = 'Evento finalizado.';
    toast.success('Evento finalizado', { description: 'El evento fue marcado como finalizado.' });
    // navigate immediately so the event disappears from the list (backend filters by status)
    await navigateTo('/admi');
  } catch (e) {
    console.error('Error finishing event:', e);
    toast.error('No se pudo terminar el evento');
    isFinishing.value = false;
  }
};

const copyCode = async () => {
  const code = props.eventData?.eventCode;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(String(code));
    toast.success('Código copiado', { description: String(code) });
  } catch (e) {
    console.error('Copy failed', e);
    toast.error('No se pudo copiar el código');
  }
};
</script>

<template>
  <Card
    class="w-full bg-background text-zinc-50 border-0 shadow-none justify-center items-center flex"
  >
    <template v-if="eventData?.eventId">
      <CardHeader class="flex flex-row justify-center gap-6 items-center">
        <div class="flex flex-col text-center">
          <span class="font-light text-secondary text-lg">Turno actual</span>
          <span class="text-6xl font-bold"> #{{ eventData.currentSpot }} </span>
        </div>
        <div class="flex flex-col">
          <CardTitle class="text-2xl md:text-nowrap">
            {{ eventData.eventName }}
          </CardTitle>
          <div class="flex flex-row text-secondary">
            <MapPin class="mr-2 h-4 w-4" />
            {{ eventData.location }}
            <div v-if="eventData.eventCode" class="ml-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span class="font-mono px-2 py-1 bg-muted rounded">{{ eventData.eventCode }}</span>
              <Button variant="ghost" size="sm" @click="copyCode">Copiar</Button>
            </div>
          </div>
        </div>
      </CardHeader>
        <CardFooter class="flex flex-col sm:flex-row gap-4 w-full md:justify-center">
          <Button variant="destructive" @click="showConfirm = true" class="w-full sm:w-auto">Terminar evento</Button>
          <Button variant="secondary" class="w-full sm:w-auto" @click="navigateTo(`/admi/scanevent?eventId=${eventData.eventId}`)">Escanear turno</Button>
        </CardFooter>
    </template>

    <template v-else>
      <CardHeader class="flex flex-col items-center gap-4 py-8">
        <div class="flex flex-col text-center">
          <span class="font-light text-secondary text-lg">Turno actual</span>
          <span class="text-6xl font-bold"> #{{ eventData.currentSpot }} </span>
        </div>
        <div class="flex flex-col items-center text-center">
          <!-- ghost SVG -->
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-4">
            <path d="M12 2C8.13401 2 5 5.13401 5 9v4.5C5 15.7091 6.79086 17.5 8.99998 17.5c1.0702 0 1.9975-0.4232 2.707-1.1118C12.7044 17.7197 13.3399 18 14 18c1.7614 0 3.2929-1.2312 3.7071-2.8789C18.7631 15.10 19 14.306 19 13.5V9c0-3.86599-3.134-7-7-7z" fill="#9CA3AF" opacity="0.9"/>
            <circle cx="9" cy="10" r="1.2" fill="#111827"/>
            <circle cx="15" cy="10" r="1.2" fill="#111827"/>
          </svg>
          <h3 class="text-xl font-semibold text-primary">No hay eventos en curso</h3>
          <p class="text-sm text-muted-foreground mt-2">Por ahora no hay eventos activos. Puedes crear uno nuevo desde "Añadir evento".</p>
        </div>
      </CardHeader>
    </template>
  </Card>
  <div v-if="isFinishing" class="register-overlay" aria-hidden="false">
    <div class="overlay-content">
      <div class="spinner">
        <div></div><div></div><div></div>
      </div>
      <div class="overlay-text">{{ finishingMessage }}</div>
    </div>
  </div>
  <!-- Confirmation modal -->
  <div v-if="showConfirm" class="w-full h-full top-0 bottom-0 right-0 left-0 flex items-center justify-center fixed bg-background/20 p-2">
    <Card class="md:min-w-120 md:w-fit w-full">
      <CardHeader class="flex flex-row justify-between items-center">
        <h1 class="text-2xl text-primary font-semibold">¿Finalizar evento?</h1>
        <Button variant="ghost" @click="showConfirm = false">Cancelar</Button>
      </CardHeader>

      <CardContent>
        <p>Al finalizar el evento se marcará como inactivo. ¿Deseas continuar?</p>
      </CardContent>

      <CardAction class="flex w-full justify-center gap-4 p-4">
        <Button variant="outline" @click="showConfirm = false">Cancelar</Button>
        <Button variant="destructive" @click="finishEventConfirm">Confirmar</Button>
      </CardAction>
    </Card>
  </div>
</template>

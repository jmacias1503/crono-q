<script setup lang="ts">
import { ref } from "vue";
import { Calendar, Clock, EllipsisVertical, MapPin, X } from "lucide-vue-next";
import { onClickOutside } from "@vueuse/core";
import QrcodeVue from 'qrcode.vue';

import type { EventSummary } from "~/types/admi-events";
const props = defineProps<{
  eventData: EventSummary;
}>();

const { eventData } = props;

const isVisible = ref(false);
const innerContainer = ref(null);

const isTakingTurn = ref(false);
const emit = defineEmits<{ (e: 'taken'): void }>();

const errorMessage = ref<string | null>(null);

const takeTurn = async () => {
  if (isTakingTurn.value) return;
  isTakingTurn.value = true;
  errorMessage.value = null;
  try {
    // Build payload without trusting client-side student_id; server uses authenticated user
    const payload: Record<string, any> = {};
    if (eventData.eventCode) payload.event_code = eventData.eventCode;
    else payload.event_id = eventData.eventId;

    const res = await $fetch('/api/turns', { method: 'POST', body: payload, credentials: 'include' });
    // emit to parent so it can refresh registered items
    emit('taken');
    // close modal
    isVisible.value = false;
    // success handled by parent refresh / UI update
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Error al tomar turno';
    if (err?.statusCode === 401 || err?.status === 401) {
      // unauthenticated - redirect to login
      try {
        (await import('#app')).navigateTo('/login');
        return;
      } catch {}
    }
    // surface error in the UI instead of alert
    errorMessage.value = String(msg);
  } finally {
    isTakingTurn.value = false;
  }
};

const showQR = ref(false);
const toggleQR = () => (showQR.value = !showQR.value);

onClickOutside(innerContainer, () => {
  if (isVisible.value) {
    isVisible.value = false;
  }
});

const toggleVisibility = () => {
  isVisible.value = !isVisible.value;
};

const formatDate = (date?: Date | null): string => {
  if (!date) return 'Fecha por definir';
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "long",
    }).format(date);
  } catch (e) {
    return 'Fecha inválida';
  }
};

const formatTime = (date?: Date | null): string => {
  if (!date) return 'Hora por definir';
  try {
    return new Intl.DateTimeFormat("es-MX", {
      timeStyle: "short",
    }).format(date);
  } catch (e) {
    return 'Hora inválida';
  }
};
</script>

<template>
  <Card class="w-full">
    <div class="flex flex-row w-full justify-between px-4">
      <div class="space-y-2">
        <CardHeader>
          <CardTitle class="text-2xl text-primary text-nowrap">{{
            eventData.eventName
          }}</CardTitle>

          <div class="flex flex-row gap-4">
            <Calendar class="h-4 w-4" />
            <span class="text-w md:text-nowrap"
              >Día de inicio: {{ formatDate(eventData.startDate) }}</span
            >
          </div>
          <div class="flex flex-row gap-4">
            <Clock class="h-4 w-4" />
            <span>Hora de inicio: {{ formatTime(eventData.startDate) }} </span>
          </div>
        </CardHeader>
        <CardContent>
          <div class="flex flex-row text-primary">
            <MapPin class="mr-2 h-4 w-4" />
            {{ eventData.location }}
          </div>
        </CardContent>
      </div>

      <div
        class="min-h-full flex flex-col items-center justify-center text-primary"
      >
        <div class="flex flex-col gap-2 items-center">
          <Button variant="ghost" class="flex w-10 h-10 p-2" @click="toggleQR">
            QR
          </Button>
          <Button
            variant="ghost"
            class="flex w-10 h-10 p-2"
            @click="toggleVisibility"
          >
            <EllipsisVertical class="w-8 h-8" />
          </Button>
        </div>
      </div>
    </div>
  </Card>

  <div
    class="w-full h-full top-0 bottom-0 right-0 left-0 flex items-center justify-center fixed bg-background/20 p-2"
    v-if="isVisible"
  >
    <Card class="md:min-w-120 md:w-fit w-full" ref="innerContainer">
      <CardHeader class="flex flex-row justify-between items-center">
        <h1 class="text-2xl text-primary font-semibold">
          {{ eventData.eventName }}
        </h1>
        <Button variant="ghost" @click="toggleVisibility"> <X /> </Button>
      </CardHeader>

      <CardContent>
        <div class="flex flex-row gap-4">
          <Calendar class="h-4 w-4" />
          <span class="md:text-nowrap"
            >Día de inicio: {{ formatDate(eventData.startDate) }}</span
          >
        </div>
        <div class="flex flex-row gap-4">
          <Clock class="h-4 w-4" />
          <span>Hora de inicio: {{ formatTime(eventData.startDate) }} </span>
        </div>
      </CardContent>
      <CardAction class="flex w-full justify-center">
        <div class="w-full max-w-xs">
          <Button variant="secondary" :disabled="isTakingTurn" @click="takeTurn" class="text-lg w-full"
            >{{ isTakingTurn ? 'Enviando...' : 'Tomar un turno' }}</Button>
          <p v-if="errorMessage" class="text-sm text-destructive mt-2 text-center">{{ errorMessage }}</p>
        </div>
      </CardAction>

      <!-- loading overlay inside modal -->
      <div v-if="isTakingTurn" class="absolute inset-0 bg-black/40 z-50 flex items-center justify-center rounded-xl">
        <div class="flex flex-col items-center gap-3 bg-card/80 p-4 rounded-lg">
          <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span class="text-sm text-primary">Tomando turno...</span>
        </div>
      </div>
    </Card>
  </div>

  <div
    class="w-full h-full top-0 bottom-0 right-0 left-0 flex items-center justify-center fixed bg-background/30 p-2"
    v-if="showQR"
  >
    <div class="bg-card w-90 h-90 flex justify-center items-center rounded-2xl flex-col gap-4 p-6">
      <div class="flex flex-col text-center">
        <span class="font-light text-primary text-lg">Código del evento</span>
        <span class="text-2xl font-bold">{{ eventData.eventName }}</span>
      </div>
      <div v-if="eventData.eventCode">
        <QrcodeVue :value="JSON.stringify({ event_code: eventData.eventCode, event_id: eventData.eventId })" :size="220" render-as="svg" level="H" />
        <div class="mt-2 text-sm text-muted-foreground">Código: <span class="font-mono">{{ eventData.eventCode }}</span></div>
      </div>
      <div v-else class="text-sm text-muted-foreground">Este evento todavía no tiene código.</div>
      <div class="flex gap-4 mt-4">
        <Button @click="toggleQR">Cerrar</Button>
      </div>
    </div>
  </div>
</template>
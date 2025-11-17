<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Angry,
  Calendar,
  Clock,
  EllipsisVertical,
  MapPin,
  TicketPlus,
  X,
} from "lucide-vue-next";
import { onClickOutside } from "@vueuse/core";
import type { CurrentSpot } from "~/types/user-spot";
import type { EventSummary } from "~/types/admi-events";

const props = defineProps<{
  eventData: EventSummary;
  spotData?: Partial<CurrentSpot> | null;
}>();

const DEFAULT = {
  userSpot: "—",
  eventName: "Sin turno registrado",
  location: "—",
  currentSpot: "—",
  waitingTime: null,
};

const userSpotDisplay = computed(() => {
  const s = props.spotData?.userSpot ?? props.spotData?.spot_number ?? props.spotData?.user_spot;
  return (s || s === 0) ? s : DEFAULT.userSpot;
});

const eventNameDisplay = computed(() => props.eventData?.eventName ?? props.eventData?.event_name ?? DEFAULT.eventName);

const locationDisplay = computed(() => props.spotData?.location ?? props.eventData?.location ?? DEFAULT.location);

const currentSpotDisplay = computed(() => {
  const v = props.spotData?.currentSpot ?? props.spotData?.current_spot;
  return (v || v === 0) ? v : DEFAULT.currentSpot;
});

const waitingTimeDisplay = computed(() => {
  const w = props.spotData?.waitingTime ?? props.spotData?.waiting_time ?? DEFAULT.waitingTime;
  if (!w) return "—";
  try {
    const d = typeof w === 'string' ? new Date(w) : w;
    const now = new Date();
    const diff = Math.max(d.getTime() - now.getTime(), 0);
    const minutes = Math.ceil(diff / (1000 * 60));
    return minutes < 1 ? 'Menos de un minuto' : `${minutes} min`;
  } catch {
    return '—';
  }
});

const emit = defineEmits<{ (e: "cancelled"): void }>();

const isVisible = ref(false);
const innerContainer = ref<HTMLElement | null>(null);

const isCancelling = ref(false);
const errorMessage = ref<string | null>(null);

onClickOutside(innerContainer, () => {
  if (isVisible.value) {
    isVisible.value = false;
  }
});

const toggleVisibility = () => {
  isVisible.value = !isVisible.value;
};

const formatDate = (date?: Date | null): string => {
  if (!date) return "Fecha por definir";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "long",
    }).format(date);
  } catch (e) {
    return "Fecha inválida";
  }
};

const formatTime = (date?: Date | null): string => {
  if (!date) return "Hora por definir";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      timeStyle: "short",
    }).format(date);
  } catch (e) {
    return "Hora inválida";
  }
};

const getTurnIdFromSpot = (): number | null => {
  const s = props.spotData as any;
  if (!s) return null;

  // Try common keys and nested shapes
  const candidates = [
    s.turn_id,
    s.turnId,
    s.id,
    s.id_turn,
    s.turn?.turn_id,
    s?.turn?.id,
    s.turn_id_str,
    s.turnId_str,
  ];

  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    const n = Number(c);
    if (!Number.isNaN(n) && Number.isFinite(n) && n > 0) return n;
  }

  // debug log to help identify shape during development
  // Remove or guard with env check in production
  // eslint-disable-next-line no-console
  console.debug('[RegisteredEventModal] spotData missing turn id:', s);
  return null;
};

const cancelTurn = async () => {
  if (isCancelling.value) return;
  errorMessage.value = null;

  const turnId = getTurnIdFromSpot();
  if (!turnId) {
    errorMessage.value = "ID de turno no disponible";
    return;
  }

  isCancelling.value = true;
  try {
    await $fetch(`/api/turns/${turnId}`, {
      method: "DELETE" as any,
      credentials: "include",
    });
    // notify parent to refresh
    emit("cancelled");
    isVisible.value = false;
  } catch (err: any) {
    // unauthenticated -> redirect to login
    if (err?.status === 401 || err?.statusCode === 401) {
      try {
        (await import("#app")).navigateTo("/login");
        return;
      } catch {}
    }
    errorMessage.value = err?.data?.message || err?.message || "No se pudo cancelar el turno";
  } finally {
    isCancelling.value = false;
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
            <span class="md:text-nowrap"
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

      <div class="min-h-full flex flex-col items-center justify-center text-primary">
        <Button variant="ghost" class="flex w-10 h-10 p-2" @click="toggleVisibility">
          <EllipsisVertical class="w-8 h-8" />
        </Button>
      </div>
    </div>
  </Card>

  <div
    class="w-full h-full top-0 bottom-0 right-0 left-0 flex items-center justify-center fixed bg-background/20 p-4"
    v-if="isVisible"
  >
    <Card class="w-full md:min-w-120 md:w-fit" ref="innerContainer">
      <CardHeader class="flex flex-row justify-between items-start">
        <div class="flex flex-col">
          <h1 class="text-2xl text-primary font-semibold">
            {{ eventData.eventName }}
          </h1>
          <div class="flex md:flex-row gap-4">
            <Calendar class="h-4 w-4" />
            <span class="md:text-nowrap"
              >Día de inicio: {{ formatDate(eventData.startDate) }}</span
            >
          </div>
          <div class="flex md:flex-row gap-4">
            <Clock class="h-4 w-4" />
            <p>Hora de inicio: {{ formatTime(eventData.startDate) }}</p>
          </div>
        </div>

        <Button variant="ghost" @click="toggleVisibility"> <X /> </Button>
      </CardHeader>

      <CardContent>
        <CardHeader class="flex flex-col md:flex-row justify-start gap-6 items-center">
          <div class="flex flex-col text-center">
            <span class="font-light text-primary text-lg">Tu Turno</span>
            <span class="text-6xl font-bold"> #{{ userSpotDisplay }} </span>
          </div>
          <div class="flex flex-col">
            <CardDescription class="flex flex-col p-1 text-primary">
              <div class="flex flex-row">
                <MapPin class="mr-2 h-4 w-4" />
                {{ locationDisplay }}
              </div>

              <div class="flex items-center gap-4">
                <div class="flex items-center">
                  <TicketPlus class="mr-3 h-4 w-4" />
                  <span>Turno Actual</span>
                </div>
                <span class="text-2xl text-primary">
                  #{{ currentSpotDisplay }}
                </span>
              </div>
            </CardDescription>
          </div>
        </CardHeader>
      </CardContent>

      <CardAction class="flex w-full justify-center">
        <div class="w-full max-w-xs">
          <Button
            variant="destructive"
            @click="cancelTurn"
            :disabled="isCancelling"
            class="text-lg w-full"
          >
            <template v-if="isCancelling">
              <svg class="animate-spin h-4 w-4 mr-2 inline-block" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Cancelando...
            </template>
            <template v-else>
              Anular turno
            </template>
          </Button>
          <p v-if="errorMessage" class="text-sm text-destructive mt-2 text-center">{{ errorMessage }}</p>
        </div>
      </CardAction>

      <!-- loading overlay while cancelling -->
      <div v-if="isCancelling" class="absolute inset-0 bg-black/40 z-50 flex items-center justify-center rounded-xl">
        <div class="flex flex-col items-center gap-3 bg-card/80 p-4 rounded-lg">
          <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span class="text-sm text-primary">Cancelando turno...</span>
        </div>
      </div>
    </Card>
  </div>
</template>
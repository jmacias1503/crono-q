<script setup lang="ts">
import { User, Ticket, Clock, MapPin } from "lucide-vue-next";
import type { CurrentSpot } from "~/types/user-spot";
import { computed } from "vue";

// allow missing or partial spotData so component can show defaults
const props = defineProps<{
  spotData?: Partial<CurrentSpot> | null;
}>();

const DEFAULT_TEXT = {
  userSpot: "—",
  eventName: "Sin turno registrado",
  location: "—",
  currentSpot: "—",
  waitingTime: "—",
};

const formatWaitingTime = (date?: Date | string | null): string => {
  if (!date) return DEFAULT_TEXT.waitingTime;
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || Number.isNaN(d.getTime())) return DEFAULT_TEXT.waitingTime;
  const now = new Date();
  const diff = Math.max(d.getTime() - now.getTime(), 0);
  const minutes = Math.ceil(diff / (1000 * 60));

  if (minutes < 1) return "Menos de un minuto";
  return `${minutes} min`;
};

const userSpotDisplay = computed(() => {
  const s = props.spotData?.userSpot ?? props.spotData?.spot_number ?? props.spotData?.user_spot;
  return s || s === 0 ? s : DEFAULT_TEXT.userSpot;
});

const eventNameDisplay = computed(() => props.spotData?.eventName ?? props.spotData?.eventName ?? DEFAULT_TEXT.eventName);

const locationDisplay = computed(() => props.spotData?.location ?? DEFAULT_TEXT.location);

const currentSpotDisplay = computed(() => {
  const v = props.spotData?.currentSpot ?? props.spotData?.current_spot;
  return (v || v === 0) ? v : DEFAULT_TEXT.currentSpot;
});

const waitingTimeDisplay = computed(() => formatWaitingTime(props.spotData?.waitingTime ?? props.spotData?.waiting_time));
</script>

<template>
  <Card class="w-full bg-background text-zinc-50 border-0 shadow-none">
    <CardHeader class="flex flex-row justify-center gap-6 items-center">
        <div class="flex flex-col text-center">
        <span class="font-light text-secondary text-lg">Tu Turno</span>
        <span class="text-6xl font-bold"> #{{ userSpotDisplay }} </span>
      </div>
      <div class="flex flex-col">
        <CardTitle class="text-2xl">
          {{ eventNameDisplay }}
        </CardTitle>
        <CardDescription class="flex flex-col p-1 text-secondary">
          <div class="flex flex-row">
            <MapPin class="mr-2 h-4 w-4" />
            {{ locationDisplay }}
          </div>

          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <div class="flex items-center">
              <Ticket class="mr-3 h-6 w-6" />
              <span>Turno Actual</span>
            </div>
            <span class="text-2xl text-secondary">
              #{{ currentSpotDisplay }}
            </span>
          </div>
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent>
      <div class="flex flex-col gap-2 justify-center items-center">
        <div class="flex items-center gap-4 w-full md:w-1/4 justify-center">
          <div class="flex items-center">
            <Clock class="mr-3 h-6 w-6" />
            <span class="font-medium">Espera Estimada</span>
          </div>
          <span> ~{{ waitingTimeDisplay }} </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

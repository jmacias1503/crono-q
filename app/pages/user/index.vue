<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { ref, computed, onMounted, onUnmounted } from "vue";
import TurnQRCode from "~/components/TurnQRCode.vue";
import UnregisteredEventSummary from "~/components/UnregisteredEventSummary.vue";
import RegisteredEventModal from "~/components/RegisteredEventModal.vue";

const isVisible = ref(false);
const innerContainer = ref(null);
onClickOutside(innerContainer, () => {
  if (isVisible.value) isVisible.value = false;
});

const toggleVisibility = () => (isVisible.value = !isVisible.value);

// Fetch real events from API
const {
  data: eventsResp,
  pending,
  error,
} = await useAsyncData("events-user", () => $fetch("/api/events"));

const events = computed(() => {
  const list = eventsResp.value?.events ?? [];
  return list.map((e: any) => ({
    eventId: e.event_id,
    eventName: e.event_name,
    startDate: e.i_hour ? new Date(e.i_hour) : undefined,
    location: e.location,
    eventCode: e.event_code,
  }));
});

const mySpot = ref<any>({
  userSpot: 0,
  eventName: "",
  currentSpot: 0,
  waitingTime: new Date(),
  location: "",
});

const registeredEvent = ref<any | null>(null);
const studentId = ref<number | null>(null);

// Variable para controlar el polling
let pollingInterval: NodeJS.Timeout | null = null;
const POLLING_INTERVAL = 3000; // 3 segundos

const fetchRegistered = async () => {
  try {
    try {
      const res = await $fetch("/api/students/student_events", {
        credentials: "include",
      });
      const turns = res.turns ?? [];
      if (!turns || turns.length === 0) {
        registeredEvent.value = null;
        mySpot.value = {
          userSpot: 0,
          eventName: "",
          currentSpot: 0,
          waitingTime: new Date(),
          location: "",
          turn_id: undefined,
        };
        studentId.value = null;
        return;
      }

      const first = turns[0];
      if (!first) {
        registeredEvent.value = null;
        return;
      }

      studentId.value = first.student_id;

      registeredEvent.value = {
        eventId: first.event.event_id,
        eventName: first.event.event_name,
        startDate: first.event.i_hour
          ? new Date(first.event.i_hour)
          : undefined,
        location: first.event.location,
        eventCode: first.event.event_code,
      };

      mySpot.value = {
        userSpot: first.spot_number ?? first.turn_id,
        eventName: first.event.event_name,
        currentSpot: 0,
        waitingTime: new Date(),
        location: first.event.location,
        turn_id: first.turn_id,
      };
      return;
    } catch (err: any) {
      if (err?.statusCode === 401 || err?.status === 401) {
        try {
          (await import("#app")).navigateTo("/login");
        } catch {}
        return;
      }
      registeredEvent.value = null;
      return;
    }
  } catch (e) {
    registeredEvent.value = null;
  }
};

// Iniciar polling cuando el componente se monta
const startPolling = () => {
  if (pollingInterval) return; // Evitar múltiples intervalos
  
  pollingInterval = setInterval(async () => {
    await fetchRegistered();
  }, POLLING_INTERVAL);
  
  console.log('🔄 Polling iniciado: actualizando cada', POLLING_INTERVAL / 1000, 'segundos');
};

// Detener polling cuando el componente se desmonta
const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('⏹️ Polling detenido');
  }
};

// Lifecycle hooks
onMounted(() => {
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});

// fetch inicial
fetchRegistered();

const onRegisteredCancelled = async () => {
  registeredEvent.value = null;
  mySpot.value = {
    userSpot: 0,
    eventName: "",
    currentSpot: 0,
    waitingTime: new Date(),
    location: "",
    turn_id: undefined,
  };
  await fetchRegistered();
};
</script>

<template>
  <div class="relative w-full h-full overflow-x-hidden">
    <div class="flex justify-center items-center flex-col gap-2">
      <CurrentEvent :spot-data="mySpot" />
      <Button variant="secondary" class="text-lg w-40" @click="toggleVisibility"
        >Generar QR</Button
      >

      <div
        class="w-full h-full top-0 bottom-0 right-0 left-0 flex items-center justify-center fixed bg-background/20"
        v-if="isVisible"
      >
        <div
          class="bg-card w-90 h-90 flex justify-center items-center rounded-2xl flex-col gap-4"
          ref="innerContainer"
        >
          <div class="flex flex-col text-center">
            <span class="font-light text-primary text-lg">Tu Turno</span>
            <span class="text-2xl font-bold"> #{{ mySpot.userSpot }} </span>
          </div>
          <TurnQRCode
            v-if="mySpot.turn_id && studentId"
            :turn-id="mySpot.turn_id"
            :student-id="studentId"
          />
          <Button class="text-xl" @click="toggleVisibility">Cerrar</Button>
        </div>
      </div>
    </div>
    <div class="flex flex-col items-center justify-center gap-6">
      <div class="px-6 md:w-2/3 flex flex-col gap-4">
        <h3 class="text-secondary text-center text-2xl">Eventos inscritos</h3>
        <template v-if="registeredEvent">
          <RegisteredEventModal
            :event-data="registeredEvent"
            :spot-data="mySpot"
            @cancelled="onRegisteredCancelled"
          />
        </template>
      </div>
      <div class="px-6 md:w-2/3 flex flex-col gap-4 pb-8">
        <h3 class="text-secondary text-center text-2xl">Eventos disponibles</h3>
        <template v-if="pending">
          <div class="py-6 text-center">Cargando eventos...</div>
        </template>
        <template v-else>
          <template v-if="events.length === 0">
            <div class="w-full flex justify-center mt-8">
              <Card
                class="bg-transparent border-transparent shadow-none md:w-2/3 w-full p-8 flex flex-col items-center text-center"
              >
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  class="mb-6"
                >
                  <path
                    d="M12 2C8.13401 2 5 5.13401 5 9v4.5C5 15.7091 6.79086 17.5 8.99998 17.5c1.0702 0 1.9975-0.4232 2.707-1.1118C12.7044 17.7197 13.3399 18 14 18c1.7614 0 3.2929-1.2312 3.7071-2.8789C18.7631 15.10 19 14.306 19 13.5V9c0-3.86599-3.134-7-7-7z"
                    fill="#9CA3AF"
                    opacity="0.95"
                  />
                  <circle cx="9" cy="10" r="1.2" fill="#111827" />
                  <circle cx="15" cy="10" r="1.2" fill="#111827" />
                </svg>
                <h2 class="text-2xl font-semibold text-primary -mt-5.5">
                  No hay eventos activos
                </h2>
                <p class="text-muted-foreground -mt-2.5 mb-6">
                  Por ahora no hay eventos en curso. Vuelve más tarde.
                </p>
              </Card>
            </div>
          </template>
          <template v-else>
            <UnregisteredEventSummary
              v-for="ev in events"
              :key="ev.eventId"
              :event-data="ev"
              @taken="fetchRegistered"
            />
          </template>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { CrossIcon } from "lucide-vue-next";
import { computed } from "vue";
import AdmiUpcomingEvents from "~/components/AdmiUpcomingEvents.vue";
import AdmiCurrentEvent from "~/components/AdmiCurrentEvent.vue";

// fetch events from the API and map to the components' expected shapes
const { data: eventsResp, pending, error } = await useAsyncData("events", () => $fetch("/api/events"));

const events = computed(() => {
  const list = eventsResp.value?.events ?? [];
  return list.map((e: any) => ({
    eventId: e.event_id,
    eventName: e.event_name,
    eventCode: e.event_code,
    // use the event's i_hour (start time) for date/time display
    startDate: new Date(e.i_hour),
    location: e.location,
  }));
});

// For the current event component, use the first event if available
const currentEvent = computed(() => {
  const first = events.value?.[0];
  if (!first) return null;
  return {
    eventId: first.eventId,
    currentSpot: 0,
    eventName: first.eventName,
    location: first.location,
  };
});
</script>

<template>
  <div class="w-full min-h-screen relative pb-28">
  <AdmiCurrentEvent v-if="currentEvent" :event-data="currentEvent" />
      <template v-else>
        <div class="w-full flex justify-center mt-8">
          <Card class="bg-transparent border-transparent shadow-none md:w-2/3 w-full p-8 flex flex-col items-center text-center">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-6">
              <path d="M12 2C8.13401 2 5 5.13401 5 9v4.5C5 15.7091 6.79086 17.5 8.99998 17.5c1.0702 0 1.9975-0.4232 2.707-1.1118C12.7044 17.7197 13.3399 18 14 18c1.7614 0 3.2929-1.2312 3.7071-2.8789C18.7631 15.10 19 14.306 19 13.5V9c0-3.86599-3.134-7-7-7z" fill="#9CA3AF" opacity="0.95"/>
              <circle cx="9" cy="10" r="1.2" fill="#111827"/>
              <circle cx="15" cy="10" r="1.2" fill="#111827"/>
            </svg>
            <h2 class="text-2xl font-semibold text-primary -mt-5.5">No hay eventos activos</h2>
            <p class="text-muted-foreground -mt-2.5 mb-6">Por ahora no hay eventos en curso. Puedes añadir un evento desde "Añadir evento".</p>
          </Card>
        </div>
      </template>

    <div class="flex flex-col items-center gap-4">
      <h1 class="text-secondary text-center text-2xl">Eventos disponibles</h1>
  <div class="px-4 sm:px-6 md:w-2/3 w-full flex flex-col gap-4">
        <template v-if="pending">
          <div class="py-6 text-center">Cargando eventos...</div>
        </template>
        <template v-else>
          <AdmiUpcomingEvents
            v-for="ev in events"
            :key="ev.eventId"
            :event-data="ev"
          />
        </template>

        <!-- Clickable card that navigates to the add-event page -->
        <NuxtLink to="/admi/addevent" class="w-full">
          <Card class="w-full cursor-pointer hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200">
            <CardContent class="flex flex-row text-primary justify-between items-center p-4">
              <p class="text-lg font-medium">Añadir evento</p>
              <CrossIcon class="opacity-70" />
            </CardContent>
          </Card>
        </NuxtLink>
      </div>
    </div>

    <footer
      class="w-full  items-center flex justify-center fixed p-4 bottom-0 bg-background"
    >
      <Button
        variant="outline"
        class="text-secondary underline hover:text-primary outline-0 shadow-none text-lg"
        >Historial de Eventos</Button
      >
    </footer>
  </div>
</template>

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
    startDate: new Date(e.day),
    location: e.location,
  }));
});

// For the current event component, use the first event if available
const currentEvent = computed(() => {
  const first = events.value?.[0];
  if (!first) return {
    eventId: 0,
    currentSpot: 0,
    eventName: 'Sin eventos',
    location: '',
  };
  return {
    eventId: first.eventId,
    currentSpot: 0,
    eventName: first.eventName,
    location: first.location,
  };
});
</script>

<template>
  <div class="w-full min-h-screen relative">
  <AdmiCurrentEvent :event-data="currentEvent" />

    <div class="flex flex-col items-center gap-4">
      <h1 class="text-secondary text-center text-2xl">Eventos disponibles</h1>
      <div class="px-6 md:w-2/3 flex flex-col gap-4">
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
      class="w-full items-center flex justify-center fixed p-4 bottom-0 bg-background"
    >
      <Button
        variant="outline"
        class="text-secondary underline hover:text-primary outline-0 shadow-none text-lg"
        >Historial de Eventos</Button
      >
    </footer>
  </div>
</template>

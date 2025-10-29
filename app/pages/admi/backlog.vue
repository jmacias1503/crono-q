<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import BacklogEvent from "~/components/BacklogEvent.vue";

const myEvent = ref({
  eventId: 42,
  currentSpot: 101,
  eventName: "Inscripción a Talleres",
  startDate: new Date("2025-11-20T09:00:00"),
  location: "Edificio A, Sala de Juntas",
});
</script>

<template>
  <div class="w-full min-h-screen flex flex-col items-center gap-4 relative">
    <div class="flex flex-row gap-2 justify-center w-full relative">
      <div class="flex absolute left-0">
        <Button variant="ghost" class="text-secondary rounded-full">
          <ArrowLeft />
        </Button>
      </div>
    </div>
    <h1 class="text-secondary text-4xl text-center">Historial de eventos</h1>

    <div class="px-6 md:w-2/3 flex flex-col gap-4">
      <BacklogEvent :event-data="myEvent" />
    </div>
  </div>
</template>

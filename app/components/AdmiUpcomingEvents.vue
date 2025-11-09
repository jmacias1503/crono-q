<script setup lang="ts">
import { ref } from "vue";
import { Calendar, Clock, EllipsisVertical, MapPin, X } from "lucide-vue-next";
import { onClickOutside } from "@vueuse/core";

import type { EventSummary } from "~/types/admi-events";
const props = defineProps<{
  eventData: EventSummary;
}>();

const isVisible = ref(false);
const innerContainer = ref(null);

onClickOutside(innerContainer, () => {
  if (isVisible.value) {
    isVisible.value = false;
  }
});

const toggleVisibility = () => {
  isVisible.value = !isVisible.value;
};

const editEvent = async () => {
  isVisible.value = false;
  try {
    await navigateTo(`/admi/editevent?eventId=${props.eventData.eventId}`);
  } catch (e) {
    // ignore navigation errors
  }
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
  <Card class="w-full p-4 sm:p-6">
    <div class="flex flex-col sm:flex-row w-full justify-between px-2 sm:px-4">
      <div class="space-y-2 w-full sm:flex-1">
        <CardHeader class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div class="flex-1">
            <div class="flex items-start justify-between">
              <CardTitle class="text-2xl text-primary md:whitespace-nowrap">{{ eventData.eventName }}</CardTitle>
              <div class="block sm:hidden">
                <Button variant="ghost" class="flex w-10 h-10 p-2" @click="toggleVisibility">
                  <EllipsisVertical class="w-8 h-8" />
                </Button>
              </div>
            </div>

            <div class="mt-2">
              <div class="flex flex-row gap-4 items-center">
                <Calendar class="h-4 w-4" />
                <span class="whitespace-normal md:whitespace-nowrap w-full">Día de inicio: {{ formatDate(eventData.startDate) }}</span>
              </div>
              <div class="flex flex-row gap-4 items-center mt-1">
                <Clock class="h-4 w-4" />
                <span>Hora de inicio: {{ formatTime(eventData.startDate) }} </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="flex flex-row text-primary">
            <MapPin class="mr-2 h-4 w-4" />
            <span class="wrap-break-word">{{ eventData.location }}</span>
          </div>
        </CardContent>
      </div>

      <!-- ellipsis button for desktop: shown when header button is hidden on desktop -->
      <div class="min-h-full flex items-center justify-center text-primary mt-4 sm:mt-0 sm:ml-4">
        <div class="hidden sm:block">
          <Button variant="ghost" class="flex w-10 h-10 p-2" @click="toggleVisibility">
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
        <Button variant="secondary" @click="editEvent" class="w-full sm:w-auto text-lg">Editar evento</Button>
      </CardAction>
    </Card>
  </div>
</template>

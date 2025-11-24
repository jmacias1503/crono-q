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

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
  }).format(date);
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("es-MX", {
    timeStyle: "short",
  }).format(date);
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
        <Button
          variant="ghost"
          class="flex w-10 h-10 p-2"
          @click="toggleVisibility"
        >
          <EllipsisVertical class="w-8 h-8" />
        </Button>
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
        <Button variant="secondary" @click="toggleVisibility" class="text-lg"
          >Descargar lista</Button
        >
      </CardAction>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
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
  spotData: CurrentSpot;
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
        <CardHeader
          class="flex flex-col md:flex-row justify-start gap-6 items-center"
        >
          <div class="flex flex-col text-center">
            <span class="font-light text-primary text-lg">Tu Turno</span>
            <span class="text-6xl font-bold"> #{{ spotData.userSpot }} </span>
          </div>
          <div class="flex flex-col">
            <CardDescription class="flex flex-col p-1 text-primary">
              <div class="flex flex-row">
                <MapPin class="mr-2 h-4 w-4" />
                {{ spotData.location }}
              </div>

              <div class="flex items-center gap-4">
                <div class="flex items-center">
                  <TicketPlus class="mr-3 h-4 w-4" />
                  <span>Turno Actual</span>
                </div>
                <span class="text-2xl text-primary">
                  #{{ spotData.currentSpot }}
                </span>
              </div>
            </CardDescription>
          </div>
        </CardHeader>
      </CardContent>
      <CardAction class="flex w-full justify-center">
        <Button variant="destructive" @click="toggleVisibility" class="text-lg"
          >Anular turno</Button
        >
      </CardAction>
    </Card>
  </div>
</template>

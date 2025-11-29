<script setup lang="ts">
import { ref, computed } from "vue";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-vue-next";
import HistoricalEventCard from "../../components/HistoricalEventCard.vue.vue";
import { toast } from "vue-sonner";

const { data: historyResp, pending, error, refresh } = await useAsyncData(
  "events-history",
  () => $fetch("/api/events/history")
);

const events = computed(() => {
  return historyResp.value?.events ?? [];
});

const isCleaningUp = ref(false);
const showCleanupModal = ref(false);

const cleanupOldEvents = async () => {
  showCleanupModal.value = false;
  
  if (isCleaningUp.value) return;
  
  isCleaningUp.value = true;
  try {
    const result = await $fetch("/api/events/cleanup", {
      method: "POST",
      body: { backup: true },
    });
    
    toast.success("Limpieza completada", {
      description: result.message,
    });
    
    if (result.backup) {
      const blob = new Blob([JSON.stringify(result.backup, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `backup_eventos_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    
    await refresh();
  } catch (error: any) {
    console.error("Error cleaning up:", error);
    toast.error("Error al limpiar eventos", {
      description: error.message || "Intenta de nuevo",
    });
  } finally {
    isCleaningUp.value = false;
  }
};
</script>

<template>
  <div class="w-full min-h-screen relative pb-8">
    <div class="flex flex-row gap-2 justify-center w-full relative mb-6 px-4">
      <div class="flex absolute left-4">
        <Button
          variant="ghost"
          class="text-secondary rounded-full"
          @click="navigateTo('/admi')"
        >
          <ArrowLeft />
        </Button>
      </div>

      <h1 class="text-secondary text-2xl md:text-4xl text-center font-bold">
        Historial de eventos
      </h1>
    </div>

    <div class="flex flex-col items-center gap-4 px-4">
      <div class="w-full md:w-2/3 flex justify-end">
        <Button
          variant="destructive"
          size="sm"
          @click="showCleanupModal = true"
          :disabled="isCleaningUp"
          class="flex items-center gap-2"
        >
          <Trash2 class="h-4 w-4" />
          Limpiar eventos antiguos
        </Button>
      </div>

      <div class="w-full md:w-2/3 flex flex-col gap-4">
        <template v-if="pending">
          <div class="py-12 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p class="text-muted-foreground">Cargando historial...</p>
          </div>
        </template>
        
        <template v-else-if="error">
          <div class="py-12 text-center">
            <p class="text-red-500">Error al cargar el historial de eventos</p>
          </div>
        </template>
        
        <template v-else-if="events.length === 0">
          <div class="w-full flex justify-center mt-8">
            <Card class="bg-transparent border-transparent shadow-none w-full p-8 flex flex-col items-center text-center">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-6">
                <path d="M12 2C8.13401 2 5 5.13401 5 9v4.5C5 15.7091 6.79086 17.5 8.99998 17.5c1.0702 0 1.9975-0.4232 2.707-1.1118C12.7044 17.7197 13.3399 18 14 18c1.7614 0 3.2929-1.2312 3.7071-2.8789C18.7631 15.10 19 14.306 19 13.5V9c0-3.86599-3.134-7-7-7z" fill="#9CA3AF" opacity="0.95"/>
                <circle cx="9" cy="10" r="1.2" fill="#111827"/>
                <circle cx="15" cy="10" r="1.2" fill="#111827"/>
              </svg>
              <h2 class="text-2xl font-semibold text-primary mb-2">No hay eventos en el historial</h2>
              <p class="text-muted-foreground">Los eventos que crees aparecerán aquí.</p>
            </Card>
          </div>
        </template>
        
        <template v-else>
          <HistoricalEventCard
            v-for="ev in events"
            :key="ev.event_id"
            :event-data="ev"
          />
        </template>
      </div>
    </div>

    <Dialog :open="showCleanupModal" @update:open="showCleanupModal = $event">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-destructive">
            <AlertTriangle class="h-5 w-5" />
            Advertencia: Eliminar eventos antiguos
          </DialogTitle>
          <DialogDescription class="pt-4 space-y-3">
            <p class="text-base">Esta acción eliminará permanentemente todos los eventos de hace más de 1 mes.</p>
            <p class="font-semibold text-primary">✓ Se creará un respaldo automático en formato JSON.</p>
            <p class="text-sm text-muted-foreground">El archivo de respaldo se descargará automáticamente.</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="gap-2 sm:gap-0 flex-col sm:flex-row">
          <Button
            variant="outline"
            @click="showCleanupModal = false"
            :disabled="isCleaningUp"
            class="w-full sm:w-auto text-white"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            @click="cleanupOldEvents"
            :disabled="isCleaningUp"
            class="w-full sm:w-auto"
          >
            {{ isCleaningUp ? 'Limpiando...' : 'Continuar' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
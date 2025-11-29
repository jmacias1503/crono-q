<script setup lang="ts">
import { ref } from "vue";
import { Calendar, Clock, MapPin, Download, Users } from "lucide-vue-next";
import { toast } from "vue-sonner";

interface EventHistoryData {
  event_id: number;
  event_name: string;
  location: string;
  i_hour: string | Date | null;
  total_registrations: number;
  students: Array<{
    student_id: number;
    first_name: string;
    last_name: string;
    career: string;
    semester: number;
    spot_number: number | null;
  }>;
}

const props = defineProps<{
  eventData: EventHistoryData;
}>();

const isExporting = ref(false);

const exportToPDF = async () => {
  if (isExporting.value) return;
  isExporting.value = true;
  try {
    // Usar URL relativa (NO window.location.origin). Evita que Vue Router intente resolver la ruta.
    const response = await fetch(`/api/events/${props.eventData.event_id}/export-pdf`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Error al generar PDF');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${props.eventData.event_name.replace(/[^a-z0-9]/gi, '_')}_registros.pdf`;
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Descarga iniciada', { description: 'El archivo PDF se está descargando.' });
  } catch (error: any) {
    console.error('Error exporting:', error);
    toast.error('Error al exportar', { description: error.message || 'No se pudo generar el archivo.' });
  } finally {
    isExporting.value = false;
  }
};

const formatDate = (date?: Date | string | null): string => {
  if (!date) return 'Fecha por definir';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "long",
    }).format(d);
  } catch (e) {
    return 'Fecha inválida';
  }
};

const formatTime = (date?: Date | string | null): string => {
  if (!date) return 'Hora por definir';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat("es-MX", {
      timeStyle: "short",
    }).format(d);
  } catch (e) {
    return 'Hora inválida';
  }
};
</script>

<template>
  <Card class="w-full p-4 sm:p-6 hover:shadow-lg transition-shadow">
    <div class="flex flex-col sm:flex-row w-full justify-between px-2 sm:px-4">
      <div class="space-y-2 w-full sm:flex-1">
        <CardHeader class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div class="flex-1">
            <div class="flex items-start justify-between">
              <CardTitle class="text-2xl text-primary">{{ eventData.event_name }}</CardTitle>
            </div>

            <div class="mt-2 space-y-1">
              <div class="flex flex-row gap-4 items-center text-sm">
                <Calendar class="h-4 w-4" />
                <span>{{ formatDate(eventData.i_hour) }}</span>
              </div>
              <div class="flex flex-row gap-4 items-center text-sm">
                <Clock class="h-4 w-4" />
                <span>{{ formatTime(eventData.i_hour) }}</span>
              </div>
              <div class="flex flex-row gap-4 items-center text-sm">
                <MapPin class="h-4 w-4" />
                <span>{{ eventData.location }}</span>
              </div>
              <div class="flex flex-row gap-4 items-center text-sm font-semibold text-primary">
                <Users class="h-4 w-4" />
                <span>{{ eventData.total_registrations }} registro(s)</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </div>

      <div class="flex items-center justify-center sm:justify-end gap-2 mt-4 sm:mt-0 sm:ml-4">
        <Button 
          variant="secondary" 
          size="sm"
          @click="exportToPDF"
          :disabled="isExporting || eventData.total_registrations === 0"
          class="flex items-center gap-2"
        >
          <Download class="h-4 w-4" />
          <span v-if="!isExporting">Descargar PDF</span>
          <span v-else>Generando...</span>
        </Button>
      </div>
    </div>
  </Card>
</template>
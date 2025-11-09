<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import { StreamBarcodeReader } from "vue-barcode-reader";
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { toast } from 'vue-sonner';

const route = useRoute();
const router = useRouter();

const isProcessing = ref(false);
const processingMessage = ref('');

const onDecode = async (text: string) => {
  if (isProcessing.value) return;
  isProcessing.value = true;
  processingMessage.value = 'Procesando QR...';

  // try parse JSON, otherwise numeric id
  let studentId: number | null = null;
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null) {
      if (parsed.student_id) studentId = Number(parsed.student_id);
      else if (parsed.id) studentId = Number(parsed.id);
    }
  } catch (e) {
    // not JSON
  }

  if (studentId === null) {
    if (/^\d+$/.test(String(text).trim())) studentId = Number(String(text).trim());
  }

  if (!studentId) {
    toast.error('QR inválido', { description: 'No se reconoció un student_id en el código.' });
    isProcessing.value = false;
    return;
  }

  const eventId = Number(route.query.eventId ?? 0);
  if (!eventId) {
    toast.error('Evento no seleccionado', { description: 'No se indicó el evento para este escaneo.' });
    isProcessing.value = false;
    return;
  }

  try {
    processingMessage.value = 'Registrando turno...';
    const res = await $fetch('/api/turns', { method: 'POST', body: { student_id: studentId, event_id: eventId } });
    toast.success('Turno registrado', { description: `Estudiante ${studentId} agregado.` });
  } catch (err: any) {
    console.error('Scan error:', err);
    const msg = err?.data?.message ?? err?.message ?? 'Error registrando turno';
    toast.error('No se pudo registrar', { description: String(msg) });
  } finally {
    isProcessing.value = false;
    processingMessage.value = '';
  }
};

const onLoaded = () => {
  console.log(`Ready to start scanning barcodes`);
};

const eventName = ref('Nombre del evento');

const fetchEvent = async () => {
  const eventId = Number(route.query.eventId ?? 0);
  if (!eventId) return;
  try {
    const res = await $fetch(`/api/events/${eventId}`);
    eventName.value = res?.event?.event_name ?? eventName.value;
  } catch (e) {
    console.error('Failed to load event for scanner:', e);
  }
};

onMounted(() => {
  fetchEvent();
});
</script>

<template>
  <div class="w-full flex flex-col justify-center items-center gap-6 px-4">
    <div class="flex flex-row gap-2 justify-center w-full relative">
      <div class="flex absolute left-0">
        <Button variant="ghost" class="text-secondary rounded-full" @click="router.back()">
          <ArrowLeft />
        </Button>
      </div>

      <h1 class="text-secondary text-2xl md:text-4xl text-center">
        {{ eventName }}
      </h1>
    </div>
    <div class="h-[80vh] flex justify-center items-center content-center">
      <StreamBarcodeReader
        @decode="onDecode"
        @loaded="onLoaded"
        class="w-80 h-80 md:w-100 md:h-100 items-center flex justify-center bg-primary"
      ></StreamBarcodeReader>
    <div v-if="isProcessing" class="register-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div class="overlay-content text-center">
        <div class="spinner mb-4" aria-hidden="true"></div>
        <div class="overlay-text">{{ processingMessage }}</div>
      </div>
    </div>
    </div>
  </div>
</template>

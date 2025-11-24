<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import { StreamBarcodeReader } from "vue-barcode-reader";
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, nextTick } from 'vue';
import { toast } from 'vue-sonner';

const route = useRoute();
const router = useRouter();

const isProcessing = ref(false);
const processingMessage = ref('');

// guard to avoid processing the same studentId repeatedly
const RECENT_TIMEOUT = 3000; // ms
const recentProcessed = new Set<number>();

const onDecode = async (text: string) => {
  // 1. Log inicial de lo que lee la cámara
  console.log('📷 [SCANNER] Texto crudo detectado:', text);

  if (isProcessing.value) {
    console.log('⚠️ [SCANNER] Ignorado: Ya se está procesando una petición.');
    return;
  }
  
  isProcessing.value = true;
  processingMessage.value = 'Procesando código...';
  await nextTick();

  // 2. Intentar parsear el ID del estudiante
  let studentId: number | null = null;

  // Intento A: JSON
  try {
    const parsed = JSON.parse(text);
    console.log('🧩 [SCANNER] JSON parseado:', parsed);
    if (typeof parsed === 'object' && parsed !== null) {
      const keys = ['student_id', 'id', 'studentId', 'student', 'userId', 'user_id'];
      for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(parsed, k) && (parsed as any)[k] != null) {
          studentId = Number((parsed as any)[k]);
          console.log(`✅ [SCANNER] ID encontrado en JSON (key: ${k}):`, studentId);
          break;
        }
      }
    }
  } catch (e) {
    console.log('ℹ️ [SCANNER] No es un JSON válido, intentando texto plano...');
  }

  // Intento B: Texto plano numérico
  if (studentId === null) {
    const trimmed = String(text).trim();
    // Extraer solo números si el string contiene algo como "user-123" o simplemente "123"
    // Si tu QR es solo el número, esto funciona. Si es una URL compleja, habría que ajustar.
    const match = trimmed.match(/(\d+)/); 
    if (match) {
        studentId = Number(match[1]);
        console.log('✅ [SCANNER] ID extraído por Regex:', studentId);
    }
  }

  // 3. Validación del ID
  if (!studentId) {
    console.warn('❌ [SCANNER] No se pudo extraer un ID válido del texto:', text);
    processingMessage.value = 'QR inválido';
    toast.error('QR inválido', { description: 'No se encontró un ID en el código.' });
    
    await new Promise((r) => setTimeout(r, 1000)); // Pausa para que el usuario vea el error
    isProcessing.value = false;
    processingMessage.value = '';
    return;
  }

  // 4. Validación del Evento
  const eventId = Number(route.query.eventId ?? 0);
  console.log('📅 [SCANNER] Event ID actual:', eventId);

  if (!eventId) {
    console.error('❌ [SCANNER] Falta el eventId en la URL (query param).');
    toast.error('Error de configuración', { description: 'No hay evento seleccionado.' });
    isProcessing.value = false;
    return;
  }

  // 5. Evitar duplicados rápidos
  if (recentProcessed.has(studentId)) {
    console.log(`⚠️ [SCANNER] Estudiante ${studentId} ignorado por timeout reciente.`);
    processingMessage.value = `Estudiante ${studentId} ya procesado`;
    toast.warning('Ya procesado', { description: `Espera unos segundos.` });
    setTimeout(() => {
      isProcessing.value = false;
      processingMessage.value = '';
    }, 1000);
    return;
  }

  // 6. Llamada a la API
    try {
    processingMessage.value = `Gestionando turno (ID: ${studentId})...`;
    
    const payload = { student_id: studentId, event_id: eventId };
    // CAMBIO AQUÍ: Apuntamos al nuevo endpoint de proceso
    console.log('🚀 [SCANNER] Enviando POST /api/turns/process con payload:', payload);

    const res = await $fetch('/api/turns/process', {
      method: 'POST' as any, 
      body: payload,
    });
    console.log('✅ [SCANNER] Respuesta del servidor:', res);

    // Agregar a lista de recientes para evitar doble escaneo inmediato
    recentProcessed.add(studentId);
    setTimeout(() => recentProcessed.delete(studentId), RECENT_TIMEOUT);

    processingMessage.value = '¡Procesado correctamente!';
    toast.success('Éxito', { description: `Estudiante ${studentId} procesado.` });
    
    await new Promise((r) => setTimeout(r, 800));
  } catch (err: any) {
    console.error('🔥 [SCANNER] Error en la petición:', err);
    const msg = err?.data?.message ?? err?.message ?? 'Error desconocido';
    processingMessage.value = `Error: ${String(msg)}`;
    toast.error('Error al procesar', { description: String(msg) });
    await new Promise((r) => setTimeout(r, 2000)); // Dejar ver el error un poco más
  } finally {
    isProcessing.value = false;
    processingMessage.value = '';
    console.log('🏁 [SCANNER] Ciclo finalizado, listo para el siguiente.');
  }
};

const onLoaded = () => {
  console.log(`📷 [SCANNER] Cámara cargada y lista.`);
};

const eventName = ref('Cargando evento...');

const fetchEvent = async () => {
  const eventId = Number(route.query.eventId ?? 0);
  if (!eventId) {
    eventName.value = 'Evento no seleccionado';
    return;
  }
  try {
    const res = await $fetch(`/api/events/${eventId}`, { method: 'GET' });
    eventName.value = res?.event?.event_name ?? 'Evento sin nombre';
  } catch (e) {
    console.error('Failed to load event for scanner:', e);
    eventName.value = 'Error cargando nombre';
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

      <h1 class="text-secondary text-2xl md:text-4xl text-center font-bold">
        {{ eventName }}
      </h1>
    </div>
    
    <div class="h-[80vh] flex justify-center items-center content-center relative">
      <!-- Scanner Component -->
      <div class="border-4 border-primary rounded-lg overflow-hidden shadow-xl">
        <StreamBarcodeReader
          @decode="onDecode"
          @loaded="onLoaded"
          class="w-80 h-80 md:w-[500px] md:h-[500px] bg-black"
        ></StreamBarcodeReader>
      </div>

      <!-- Overlay de procesamiento -->
      <div v-if="isProcessing" class="absolute inset-0 z-50 flex items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm">
        <div class="text-center p-6 bg-white rounded-xl shadow-2xl max-w-xs mx-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div class="text-lg font-medium text-gray-900">{{ processingMessage }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
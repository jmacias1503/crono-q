<script setup lang="ts">
import QrcodeVue from "qrcode.vue";
import { computed } from "vue";

const props = defineProps<{
  turnId: number | string;
  studentId: number | string;
}>();

const turnInformation = computed(() => {
  return JSON.stringify({ 
    student_id: Number(props.studentId),
    turn_id: Number(props.turnId)
  });
});
</script>

<template>
  <div>
    <QrcodeVue :value="turnInformation" :size="200" render-as="svg" level="H" />
  </div>
</template>
<script setup lang="ts">
import route from "@/routes/route-client/rest-path/[...name]";
import { ref } from "vue";

const result = ref(null);
const { name } = defineProps<{ name: string }>();

async function send() {
  const response = await route.post({ path: { name } });
  result.value = await response.json();
}
</script>

<template>
  <button @click="send">Send</button>
  <span v-if="result !== null" id="result">{{ JSON.stringify(result) }}</span>
</template>

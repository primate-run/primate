<script setup>
import route from "#route/route-client/path/[name]";
import { ref } from "vue";

const result = ref(null);

async function send() {
  const response = await route.post({ path: { name: "hello" } });
  result.value = await response.json();
}
</script>

<template>
  <button @click="send">Send</button>
  <span v-if="result !== null" id="result">{{ JSON.stringify(result) }}</span>
</template>

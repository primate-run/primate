<script setup>
import { ref } from "vue";
import route from "#route/route-client/blob";
const result = ref(null);
async function send() {
  const body = new Blob(["hello"], { type: "application/octet-stream" });
  const response = await route.post({ body });
  result.value = new TextDecoder().decode(await response.arrayBuffer());
}
</script>
<template>
  <button @click="send">Send</button>
  <span v-if="result !== null" id="result">{{ result }}</span>
</template>

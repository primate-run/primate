<script setup>
import { ref } from "vue";
import route from "#route/route-client/form";
const result = ref(null);
async function send() {
  const response = await route.post({ body: new URLSearchParams({ foo: "bar" }) });
  result.value = JSON.stringify(await response.json());
}
</script>
<template>
  <button @click="send">Send</button>
  <span v-if="result !== null" id="result">{{ result }}</span>
</template>

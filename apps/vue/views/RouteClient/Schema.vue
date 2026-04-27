<script setup>
import { ref } from "vue";
import route from "#route/route-client/schema";

const result = ref(null);
const error = ref(null);

async function send() {
  const response = await route.post({ body: { foo: "bar" } });
  result.value = JSON.stringify(await response.json());
}
async function send_invalid() {
  const response = await route.post({ body: { foo: 123 } });
  error.value = response.status;
}
</script>
<template>
  <button id="send" @click="send">Send</button>
  <button id="send-invalid" @click="send_invalid">Send Invalid</button>
  <span v-if="result !== null" id="result">{{ result }}</span>
  <span v-if="error !== null" id="error">{{ error }}</span>
</template>

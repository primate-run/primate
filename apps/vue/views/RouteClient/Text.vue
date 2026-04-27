<script setup>
import { ref } from "vue";
import route from "#route/route-client/text";

const result = ref(null);

async function send() {
  const response = await route.post({ body: "hello" });
  result.value = await response.text();
}
</script>

<template>
  <button @click="send">Send</button>
  <span v-if="result !== null" id="result">{{ result }}</span>
</template>

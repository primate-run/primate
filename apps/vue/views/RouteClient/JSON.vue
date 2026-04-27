<script setup>
import { ref } from "vue";
import route from "#route/route-client/json";

const result = ref(null);

async function send() {
  const response = await route.post({ body: { foo: "bar" } });
  result.value = JSON.stringify(await response.json());
}
</script>

<template>
  <button @click="send">Send</button>
  <span v-if="result !== null" id="result">{{ result }}</span>
</template>

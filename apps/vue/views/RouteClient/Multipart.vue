<script setup>
import { ref } from "vue";
import route from "#route/route-client/multipart";
const result = ref(null);
async function send() {
  const body = new FormData();
  body.append("foo", "bar");
  body.append("file", new File(["hello"], "hello.txt", { type: "text/plain" }));
  const response = await route.post({ body });
  result.value = JSON.stringify(await response.json());
}
</script>
<template>
  <button @click="send">Send</button>
  <span v-if="result !== null" id="result">{{ result }}</span>
</template>

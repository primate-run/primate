<script setup>
import route from "#route/route-client/text";

const response = await route.post({ body: "hello" });
const result = await response.text();
</script>
<template>
  <span id="result">{{ result }}</span>
</template>

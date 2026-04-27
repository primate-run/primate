<script setup>
import route from "#route/route-client/schema";

const response = await route.post({ body: { foo: "bar" } });
const result = await response.json();
</script>
<template>
  <span id="result">{{ JSON.stringify(result) }}</span>
</template>

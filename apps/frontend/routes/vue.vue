<script setup>
import frontends from "../lib/frontends.ts";

defineProps(["current"]);
</script>

<template>
  <main>
    <h1 id="current">{{ current }}</h1>
    <nav><a v-for="frontend in frontends" :id="`to-${frontend.name}`" :href="`/${frontend.name}`">{{ frontend.name }}</a></nav>
  </main>
</template>

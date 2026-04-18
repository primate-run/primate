<script setup lang="ts">
const { request } = defineProps<{ request?: string }>();
</script>

<template>
  <span id="request">{{ request }}</span>
</template>

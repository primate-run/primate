<script setup lang="ts">
  interface Props { message: string };
  defineProps<Props>();
</script>

<template>
  <div>
    <h1>{{ message }}</h1>
  </div>
</template>
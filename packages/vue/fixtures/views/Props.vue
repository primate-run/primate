<script setup lang="ts">
const { foo } = defineProps<{ foo: string }>();
</script>

<template>
  Hello,<span>{{ foo }}</span>.
</template>

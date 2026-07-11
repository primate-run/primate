<script setup lang="ts">
import type route from "./[id]";

type Props = typeof route.get.Page;

const props = defineProps<{ id: Props["id"] }>();
</script>

<template>
  <h1>Post {{ props.id }}</h1>
</template>

<script setup lang="ts">
import type route from "./index";

type Props = typeof route.get.Page;

const props = defineProps<{ message: Props["message"] }>();
</script>

<template>
  <span id="result">{{ props.message }}</span>
</template>

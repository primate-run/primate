<script setup lang="ts">
import type route from "#route/route-client/props-type";

type Props = typeof route.get.View;

const props = defineProps<{ message: Props["message"] }>();
</script>

<template>
  <span id="result">{{ props.message }}</span>
</template>

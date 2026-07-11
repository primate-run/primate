<script setup lang="ts">
import type route from "./+layout";

type Props = typeof route.get.Page;

const props = defineProps<{ layout: Props["layout"] }>();
</script>

<template>
  <section>
    <span id="layout-page">{{ props.layout }}</span>
    <slot />
  </section>
</template>

<script setup lang="ts">
import type route from "./+layout";

type Props = typeof route.get.Page;

const props = defineProps<{ section: Props["section"] }>();
</script>

<template>
  <main :data-section="props.section">
    <slot />
  </main>
</template>

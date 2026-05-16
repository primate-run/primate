<script setup lang="ts">
  import t from "#i18n";
</script>

<template>
  <span id="layout-locale">{{ t.locale.get() }}</span>
  <slot />
</template>

<script setup lang="ts">
  import t from "#lib/i18n";
</script>

<template>
  <span id="layout-locale">{{ t.locale.get() }}</span>
  <slot />
</template>

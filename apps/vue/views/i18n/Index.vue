<script setup lang="ts">
  import t from "#lib/i18n";
</script>

<template>
  <span id="locale">{{ t.locale.get() }}</span>
  <span id="title">{{ t("title") }}</span>
  <button id="de" @click="t.locale.set('de-DE')">{{ t("german") }}</button>
  <button id="en" @click="t.locale.set('en-US')">{{ t("english") }}</button>
</template>

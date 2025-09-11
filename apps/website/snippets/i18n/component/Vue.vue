<template>
  <h1>{{ t("title") }}</h1>
  <p>{{ t("greet_user", { name: "John" }) }}</p>
  <p>{{ t("counter", { count }) }}</p>
  <button @click="() => t.locale.set('en')">{{ t("english") }}</button>
  <button @click="() => t.locale.set('de')">{{ t("german") }}</button>
</template>

<script setup lang="ts">
import t from "#i18n";

defineProps<{
  count: number;
}>();
</script>

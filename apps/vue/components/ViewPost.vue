<script setup lang="ts">
import t from "#i18n";

interface Post { id: number; title: string }
const { post } = defineProps<{ post: Post }>();

</script>

<template>
  <h1>{{ t("title") }}: {{ post.title }}</h1>

  <div>Id: {{ post.id }}</div>

  <h3>{{ t("switch_language") }}</h3>
  <button @click="t.locale.set('en-US')">{{ t("english") }}</button>
  <button @click="t.locale.set('de-DE')">{{ t("german") }}</button>
</template>

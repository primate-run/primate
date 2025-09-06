<script setup lang="ts">
interface Post { id: string | number; title: string }
const { post } = defineProps<{ post: Post }>();
</script>

<template>
  <h2>
    <a :href="`/post/${post.id}`">{{ post.title }}</a>
  </h2>
</template>

<template>
  <h1>All posts</h1>
  <div v-for="post in posts">
    <h2><a :href="`/vue/post/view/${post.id}`">{{post.title}}</a></h2>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  posts: {
    type: Object,
  },
});
</script>

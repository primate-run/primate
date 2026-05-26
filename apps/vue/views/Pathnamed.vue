<script setup lang="ts">
import { useRequest } from "app:vue";
const request = useRequest();
</script>

<template>
  <span id="pathname">{{ request.url.pathname }}</span>
  <a id="previous" href="/pathname">previous</a>
</template>

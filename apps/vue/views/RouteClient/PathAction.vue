<script setup lang="ts">
import route from "@/routes/route-client/path-action/[name]";
import client from "@primate/vue/client";

const { name } = defineProps<{ name: string }>();
const form = client.form(route.post, { path: { name } });
</script>

<template>
  <form :id="form.id" @submit="form.submit">
    <input id="foo" name="foo" />
    <button id="send" type="submit">Send</button>
    <span v-if="form.submitted" id="result">{{ JSON.stringify(form.result) }}</span>
    <span v-if="form.field('foo').error" id="error">{{ form.field('foo').error }}</span>
  </form>
</template>

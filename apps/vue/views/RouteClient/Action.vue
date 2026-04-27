<script setup>
import route from "#route/route-client/action";
import { client } from "@primate/vue";

const form = client.form(route.post);
</script>
<template>
  <form :id="form.id" @submit="form.submit">
    <input id="foo" name="foo" />
    <button id="send" type="submit">Send</button>
    <span v-if="form.submitted" id="result">{{ JSON.stringify({ foo: "hello" }) }}</span>
    <span v-if="form.field('foo').error" id="error">{{ form.field('foo').error }}</span>
  </form>
</template>

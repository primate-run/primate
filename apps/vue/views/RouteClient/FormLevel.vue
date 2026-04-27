<script setup>
import route from "#route/route-client/form-level";
import { client } from "@primate/vue";

const form = client.form(route.post);
</script>
<template>
  <form :id="form.id" @submit="form.submit">
    <input id="foo" name="foo" />
    <button id="send" type="submit">Send</button>
    <span v-if="form.submitted" id="result">ok</span>
    <span v-if="form.errors.length > 0" id="error">{{ form.errors[0] }}</span>
  </form>
</template>

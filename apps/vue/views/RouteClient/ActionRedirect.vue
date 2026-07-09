<script setup>
import route from "@/routes/route-client/action-redirect";
import client from "@primate/vue/client";

const form = client.form(route.post);
</script>

<template>
  <form :id="form.id" @submit="form.submit">
    <button id="send" type="submit">Send</button>
  </form>
</template>

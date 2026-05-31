<script setup lang="ts">
import client from "@primate/vue/client";

const form = client.form({ initial: { email: "" } });
</script>

<template>
  <p v-if="form.submitted" id="submitted">submitted</p>
  <form v-else method="post" :id="form.id" @submit="form.submit">
    <button type="submit">Submit</button>
  </form>
</template>

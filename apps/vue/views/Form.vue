<script setup lang="ts">
import client from "@primate/vue/client";

interface Props { counter: number; id: string }
const props = defineProps<Props>();

const form = client.form({ initial: { counter: props.counter } });
</script>

<template>
  <form
    :id="form.id"
    method="post"
    :action="`/form?id=${props.id}`"
    @submit="form.submit"
  >
    <p v-if="form.errors.length" style="color: red">{{ form.errors[0] }}</p>

    <label>
      Counter:
      <input
        v-once
        type="number"
        :name="form.field('counter').name"
        :value="form.field('counter').value"
      />
    </label>

    <p v-if="form.field('counter').error" style="color: red">
      {{ form.field('counter').error }}
    </p>

    <button type="submit" :disabled="form.submitting">Save</button>
  </form>
</template>

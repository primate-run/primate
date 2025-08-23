<script lang="ts" setup>
import { computed } from "vue";
import validate from "@primate/vue/validate";

interface Props { id: string; counter: number };

const props = defineProps<Props>();
const counter = validate<number>(props.value).post(
  `/counter?id=${props.id}`,
);
const loading = computed(() => counter.loading.value);
const error = computed(() => counter.error.value?.message);
</script>

<template>
  <div style="margin-top: 2rem; text-align: center;">
    <h2>Counter Example</h2>
    <div>
      <button @click="counter.update(n => n - 1)" :disabled="loading">
        -
      </button>

      <span style="margin: 0 1rem;">{{ counter.value }}</span>

      <button @click="counter.update(n => n + 1)" :disabled="loading">
        +
      </button>
    </div>

    <p v-if="counter.error" style="color: red; margin-top: 1rem;">
      {{ error }}
    </p>
  </div>
</template>

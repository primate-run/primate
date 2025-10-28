<template>
  <div style="text-align: center; margin-top: 2rem;">
    <h2>Counter Example</h2>
    <div>
      <button @click="decrement">-</button>
      <span style="margin: 0 1rem;">{{ counter }}</span>
      <button @click="increment">+</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  start: {
    type: Number,
    default: 0,
  },
});

const counter = ref(props.start);

function increment() {
  counter.value++;
}

function decrement() {
  counter.value--;
}
</script>

<script lang="ts">
  let { start = 0 } = $props();
  let counter = $state(start);
</script>

<div style="text-align: center; margin-top: 2rem;">
  <h2>Counter Example</h2>
  <div>
    <button onclick={() => counter--}>-</button>
    <span style="margin: 0 1rem;">{counter}</span>
    <button onclick={() => counter++}>+</button>
  </div>
</div>

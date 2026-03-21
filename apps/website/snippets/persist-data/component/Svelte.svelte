<script lang="ts">
  import client from "@primate/svelte/client";
  export let id, value;

  const counter = client.field<number>(value).post(`/counter?id=${id}`);
</script>

<div style="margin-top: 2rem; text-align: center;">
  <h2>Counter Example</h2>
  <div>
    <button
      on:click={() => counter.update((n) => n - 1)}
      disabled={$counter.loading}
    >
      -
    </button>

    <span style="margin: 0 1rem;">{$counter.value}</span>

    <button
      on:click={() => counter.update((n) => n + 1)}
      disabled={$counter.loading}
    >
      +
    </button>
  </div>

  {#if $counter.error}
    <p style="color: red; margin-top: 1rem;">
      {$counter.error.message}
    </p>
  {/if}
</div>

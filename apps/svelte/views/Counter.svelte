<script lang="ts">
  import client from "@primate/svelte/client";
  const props: { id: string; counter: number } = $props();
  const counter = client.field(props.counter).post(`/counter?id=${props.id}`);
</script>

<div style="margin-top: 2rem; text-align: center;">
  <h2>Counter Example</h2>
  <div>
    <button
      onclick={() => counter.update((n) => n - 1)}
      disabled={$counter.loading}
    >
      -
    </button>

    <span style="margin: 0 1rem;">{$counter.value}</span>

    <button
      onclick={() => counter.update((n) => n + 1)}
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

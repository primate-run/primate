<script lang="ts">
  import validate from "@primate/svelte/validate";
  const { id, counter }: { id: string; counter: number } = $props();

  const _counter = validate<number>(counter).post(`/counter?id=${id}`);
</script>

<div style="margin-top: 2rem; text-align: center;">
  <h2>Counter Example</h2>
  <div>
    <button
      onclick={() => _counter.update((n) => n - 1)}
      disabled={$_counter.loading}
    >
      -
    </button>

    <span style="margin: 0 1rem;">{$_counter.value}</span>

    <button
      onclick={() => _counter.update((n) => n + 1)}
      disabled={$_counter.loading}
    >
      +
    </button>
  </div>

  {#if $_counter.error}
    <p style="color: red; margin-top: 1rem;">
      {$_counter.error.message}
    </p>
  {/if}
</div>

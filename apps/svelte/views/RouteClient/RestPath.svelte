<script lang="ts">
  import route from "#route/route-client/rest-path/[...name]";
  let result = $state(null);
  const { name } = $props();

  async function send() {
    const response = await route.post({ path: { name } });
    result = await response.json();
  }
</script>

<button onclick={send}>Send</button>
{#if result !== null}
  <span id="result">{JSON.stringify(result)}</span>
{/if}

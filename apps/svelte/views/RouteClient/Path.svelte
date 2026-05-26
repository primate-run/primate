<script>
  import route from "#route/route-client/path/[name]";
  let result = $state(null);
  async function send() {
    const response = await route.post({ path: { name: "hello" } });
    result = await response.json();
  }
</script>

<button onclick={send}>Send</button>
{#if result !== null}
  <span id="result">{JSON.stringify(result)}</span>
{/if}

<script>
  import route from "#route/route-client/json";

  let result = $state(null);

  async function send() {
    const response = await route.post({ body: { foo: "bar" } });
    result = await response.json();
  }
</script>

<button onclick={send}>Send</button>
{#if result !== null}
  <span id="result">{JSON.stringify(result)}</span>
{/if}

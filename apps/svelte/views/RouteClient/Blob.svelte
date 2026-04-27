<script>
  import route from "#route/route-client/blob";
  let result = $state(null);
  async function send() {
    const body = new Blob(["hello"], { type: "application/octet-stream" });
    const response = await route.post({ body });
    result = new TextDecoder().decode(await response.arrayBuffer());
  }
</script>

<button onclick={send}>Send</button>
{#if result !== null}
  <span id="result">{result}</span>
{/if}

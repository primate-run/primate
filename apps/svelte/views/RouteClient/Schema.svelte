<script>
  import route from "#route/route-client/schema";
  let result = $state(null);
  let error = $state(null);
  async function send() {
    const response = await route.post({ body: { foo: "bar" } });
    result = JSON.stringify(await response.json());
  }
  async function send_invalid() {
    const response = await route.post({ body: { foo: 123 } });
    error = response.status;
  }
</script>

<button id="send" onclick={send}>Send</button>
<button id="send-invalid" onclick={send_invalid}>Send Invalid</button>
{#if result !== null}
  <span id="result">{result}</span>
{/if}
{#if error !== null}
  <span id="error">{error}</span>
{/if}

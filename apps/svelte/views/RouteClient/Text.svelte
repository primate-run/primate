<script>
  import route from "#route/route-client/text";

  let result = $state(null);

  async function send() {
    const response = await route.post({ body: "hello" });
    result = await response.text();
  }
</script>

<button onclick={send}>Send</button>
{#if result !== null}
  <span id="result">{result}</span>
{/if}

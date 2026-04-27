<script>
  import route from "#route/route-client/form";
  let result = $state(null);
  async function send() {
    const response = await route.post({
      body: new URLSearchParams({ foo: "bar" }),
    });
    result = await response.json();
  }
</script>

<button onclick={send}>Send</button>
{#if result !== null}
  <span id="result">{JSON.stringify(result)}</span>
{/if}

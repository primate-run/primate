<script>
  import route from "#route/route-client/multipart";
  let result = $state(null);
  async function send() {
    const body = new FormData();
    body.append("foo", "bar");
    body.append(
      "file",
      new File(["hello"], "hello.txt", { type: "text/plain" }),
    );
    const response = await route.post({ body });
    result = await response.json();
  }
</script>

<button onclick={send}>Send</button>
{#if result !== null}
  <span id="result">{JSON.stringify(result)}</span>
{/if}

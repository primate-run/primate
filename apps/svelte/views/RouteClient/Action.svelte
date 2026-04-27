<script>
  import route from "#route/route-client/action";
  import { client } from "@primate/svelte";

  const form = client.form(route.post);
</script>

<form id={$form.id} onsubmit={$form.submit}>
  <input id="foo" name="foo" />
  <button id="send" type="submit">Send</button>
  {#if $form.submitted}
    <span id="result">{JSON.stringify({ foo: "hello" })}</span>
  {/if}
  {#if $form.field("foo").error}
    <span id="error">{$form.field("foo").error}</span>
  {/if}
</form>

<script>
  import route from "#route/route-client/form-level";
  import { client } from "@primate/svelte";

  const form = client.form(route.post);
</script>

<form id={$form.id} onsubmit={$form.submit}>
  <input id="foo" name="foo" />
  <button id="send" type="submit">Send</button>
  {#if $form.submitted}<span id="result">ok</span>{/if}
  {#if $form.errors.length > 0}<span id="error">{$form.errors[0]}</span>{/if}
</form>

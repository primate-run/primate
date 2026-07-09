<script lang="ts">
  import route from "@/routes/route-client/path-action/[name]";
  import client from "@primate/svelte/client";

  const { name } = $props<{ name: string }>();
  const form = client.form(route.post, { path: { name } });
</script>

<form id={$form.id} onsubmit={$form.submit}>
  <input id="foo" name="foo" />
  <button id="send" type="submit">Send</button>
  {#if $form.submitted}
    <span id="result">{JSON.stringify($form.result)}</span>
  {/if}
  {#if $form.field("foo").error}
    <span id="error">{$form.field("foo").error}</span>
  {/if}
</form>

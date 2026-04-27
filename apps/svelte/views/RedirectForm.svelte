<script lang="ts">
  import { client } from "@primate/svelte";

  const form = client.form({ initial: { email: "" } });
</script>

<form method="post" id={$form.id} onsubmit={$form.submit}>
  {#if $form.errors.length}
    <p style="color: red">{$form.errors[0]}</p>
  {/if}
  <input
    type="email"
    name={$form.field("email").name}
    value={$form.field("email").value}
    placeholder="your@email.com"
    required
    disabled={$form.submitting}
  />
  {#if $form.field("email").error}
    <p style="color: red">{$form.field("email").error}</p>
  {/if}
  <button type="submit" disabled={$form.submitting}>Submit</button>
</form>

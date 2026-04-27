<script lang="ts">
  import { client } from "@primate/svelte";
  const props: { id: number; counter: number } = $props();

  const form = client.form({ initial: { counter: props.counter } });
</script>

<form
  method="post"
  action={`/form?id=${props.id}`}
  id={$form.id}
  onsubmit={$form.submit}
>
  {#if $form.errors.length}
    <p style="color: red">{$form.errors[0]}</p>
  {/if}

  <label>
    Counter:
    <input
      type="number"
      name={$form.field("counter").name}
      value={$form.field("counter").value}
    />
  </label>

  {#if $form.field("counter").error}
    <p id="counter-error" style="color: red">{$form.field("counter").error}</p>
  {/if}

  {#if $form.submitted}<span id="submitted">saved</span>{/if}
  <button type="submit" disabled={$form.submitting}>Save</button>
</form>

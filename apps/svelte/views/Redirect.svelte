<script lang="ts">
  import client from "@primate/svelte/client";
  const form = client.form({ initial: { email: "" } });
</script>

{#if $form.submitted}
  <p id="submitted">submitted</p>
{:else}
  <form method="post" id={$form.id} onsubmit={$form.submit}>
    <button type="submit">Submit</button>
  </form>
{/if}

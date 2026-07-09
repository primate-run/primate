<script lang="ts">
  import route from "@/routes/route-client/action-redirect";
  import client from "@primate/svelte/client";

  const form = client.form(route.post);
</script>

<form id={$form.id} onsubmit={$form.submit}>
  <button id="send" type="submit">Send</button>
</form>

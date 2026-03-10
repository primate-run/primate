<script lang="ts">
  import { request } from "app:svelte";
</script>

<span id="pathname">{$request.url.pathname}</span>

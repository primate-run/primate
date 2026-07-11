<script lang="ts">
  import type route from "./index";

  const props: typeof route.get.Page = $props();
</script>

<span id="result">{props.message}</span>

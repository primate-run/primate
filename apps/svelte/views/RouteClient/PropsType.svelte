<script lang="ts">
  import type route from "@/routes/route-client/props-type";

  const props: typeof route.get.Page = $props();
</script>

<span id="result">{props.message}</span>

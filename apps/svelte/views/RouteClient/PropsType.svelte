<script lang="ts">
  import type route from "#route/route-client/props-type";

  const props: typeof route.get.View = $props();
</script>

<span id="result">{props.message}</span>

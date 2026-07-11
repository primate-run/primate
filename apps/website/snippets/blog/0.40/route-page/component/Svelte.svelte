<script lang="ts">
  import type route from "./[id]";

  const props: typeof route.get.Page = $props();
</script>

<h1>Post {props.id}</h1>

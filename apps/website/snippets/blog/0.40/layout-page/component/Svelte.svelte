<script lang="ts">
  import type route from "./+layout";

  const props: typeof route.get.Page & { children: any } = $props();
</script>

<main data-section={props.section}>
  {@render props.children()}
</main>

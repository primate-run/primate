<script lang="ts">
  import type route from "./+layout";

  const props: typeof route.get.Page & { children: any } = $props();
</script>

<section>
  <span id="layout-page">{props.layout}</span>
  {@render props.children()}
</section>

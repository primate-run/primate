<script lang="ts">
  import frontends from "../lib/frontends.ts";

  const { current } = $props();
</script>

<main>
  <h1 id="current">{current}</h1>
  <nav>{#each frontends as frontend}<a id={`to-${frontend.name}`} href={`/${frontend.name}`}>{frontend.name}</a>{/each}</nav>
</main>

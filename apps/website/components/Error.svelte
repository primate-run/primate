<script>
  import { onMount } from "svelte";
  import Header from "#component/Header";

  export let app;

  let location = "";

  onMount(() => {
    location = globalThis.window.location.pathname;
  });
</script>

<Header {app} title="Page not found" />
<main>
  <article>
    <h1>Page not found</h1>

    <p>
      The requested page <strong>{location}</strong> does not exist.
    </p>
  </article>
</main>

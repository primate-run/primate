<script>
  import Header from "#component/Header";

  export let pathname;
</script>

<Header title="Page not found" />
<main>
  <article>
    <h1>Page not found</h1>

    <p>
      The requested page <strong>{pathname}</strong> does not exist.
    </p>
  </article>
</main>

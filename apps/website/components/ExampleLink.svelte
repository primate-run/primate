<script>
  export let title, url;

  $: href = url ?? title.toLowerCase().replaceAll(" ", "-");
</script>

<a class="example-link" href={`/guides/${href}`}>
  {@html title.replace(/`([^`]+)`/g, "<code>$1</code>")}
</a>

<style>
  .example-link {
    display: block;
    padding: 6px 10px;
    color: var(--fg2);
    text-decoration: none;
  }
  .example-link:hover {
    text-decoration: underline;
  }
</style>

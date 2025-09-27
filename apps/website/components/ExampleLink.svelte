<script>
  export let title, url;

  $: href = url ?? title.toLowerCase().replaceAll(" ", "-");
</script>

<a class="example-link" href={`/guides/${href}`}>{title}</a>

<style>
  .example-link {
    display: flex;
    padding: 6px 10px;
    color: var(--fg2);
    text-decoration: none;
  }
  .example-link:hover {
    text-decoration: underline;
  }
</style>

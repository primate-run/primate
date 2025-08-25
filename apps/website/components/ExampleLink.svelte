<script>
  export let title, url;

  $: href = url ?? title.toLowerCase().replaceAll(" ", "-");
</script>

<a class="example-link" href={`/guides/${href}`}>{title}</a>

<style>
  .example-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem 1rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: color-mix(in srgb, var(--caption-bg) 65%, transparent);
    color: var(--fg);
    text-decoration: none;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease,
      transform 0.15s ease;
  }
  .example-link::after {
    content: "↗";
    font-size: 0.9rem;
    opacity: 0.7;
  }
  .example-link:hover {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--caption-bg) 80%, transparent);
    transform: translateY(-1px);
  }
</style>

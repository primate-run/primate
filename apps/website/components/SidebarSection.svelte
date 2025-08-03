<script>
  export let section, path, toc;

  const _toc = toc.filter((item) => item.depth > 1);
</script>

<li class="heading">{section.title}</li>
{#each section.items as item}
  <li class={item.href === path ? "current" : ""}>
    <a href={`/docs${item.href}`}>{item.title}</a>
  </li>
  {#if item.href === path}
    {#each _toc as tocitem}
      <li class={`depth-${tocitem.depth}`}>
        <a href={`/docs${item.href}#${tocitem.slug}`}>{tocitem.text}</a>
      </li>
    {/each}
  {/if}
{/each}

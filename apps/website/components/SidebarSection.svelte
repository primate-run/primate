<script>
  export let section, path, toc;

  $: _toc = (toc ?? []).filter((item) => item.depth > 1);
</script>

<li class="heading">{section.title}</li>
{#each section.items as item}
  <li class={item.href === path ? "current" : ""}>
    <a href={`/docs${item.href}`}>{item.title}</a>
  </li>
  {#if item.href === path}
    {#each _toc as tocitem}
      <li class={`depth-${tocitem.depth}`}>
        <a href={`/docs${path === "/" ? "" : path}#${tocitem.slug}`}
          >{tocitem.text}</a
        >
      </li>
    {/each}
  {/if}
{/each}

<script>
  export let sidebar;
</script>

<nav class="sidebar">
<ul>
  {#each sidebar as line}
<li class={line.heading ? "heading" : ""}>
  {#if line.heading !== undefined}
    {line.heading}
  {:else}
    <a href={line.link} class={line.current ? "current": ""}>{line.title}</a>
  {/if}
</li>
{/each}
</ul>
</nav>

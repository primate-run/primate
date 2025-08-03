<script>
  import SidebarSection from "#component/SidebarSection";

  export let sidebar, toc, path;
</script>

<nav class="sidebar">
  <ul>
    {#each sidebar as section}
      <SidebarSection {section} {path} {toc} />
    {/each}
  </ul>
</nav>

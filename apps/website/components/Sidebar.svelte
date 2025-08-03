<script>
  import SidebarSection from "#component/SidebarSection";

  export let sidebar, toc;
</script>

<nav class="sidebar">
  <ul>
    {#each sidebar as section}
      <SidebarSection {section} />
    {/each}
  </ul>
</nav>

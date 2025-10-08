<script>
  import Header from "#component/Header";
  import Sidebar from "#component/Sidebar";

  export let content, toc, app, path;

  let previous, next, sidebar, title;
  $: {
    sidebar = app.theme.sidebar;
    const flattened = sidebar.flatMap((item) => item.items);
    const index = flattened.findIndex((item) => item.href === path);
    previous = flattened[index - 1];
    next = flattened[index + 1];
    title = toc[0].text;
  }
</script>

<Header {app} {title} />
<main>
  {#if sidebar !== undefined}
    <Sidebar {sidebar} {toc} {path} />
  {/if}
  <article>
    {@html content}
    <div class="controls">
      <span class="prev">
        {#if previous !== undefined}
          <div class="heading">Previous</div>
          <a href={`/docs${previous.href}`}>{previous.title}</a>
        {/if}
      </span>
      <span class="next">
        {#if next !== undefined}
          <div class="heading">Next</div>
          <a href={`/docs${next.href}`}>{next.title}</a>
        {/if}
      </span>
    </div>
  </article>
</main>

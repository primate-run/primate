<script>
  import Header from "#component/Header";
  import Sidebar from "#component/Sidebar";
  import OnThisPage from "#component/OnThisPage";

  export let content, toc, app, sidebar, page;

  const [{ text: title }] = toc;
</script>

<Header {app} {title} />
<main>
  {#if sidebar !== undefined}
    <Sidebar {sidebar} {toc} />
  {/if}
  <article>
    {@html content}
    <div class="controls">
      <span class="prev">
        {#if page.previous !== undefined}
          <div class="heading">Previous</div>
          <a href={page.previous.link}>{page.previous.title}</a>
        {/if}
      </span>
      <span class="next">
        {#if page.next !== undefined}
          <div class="heading">Next</div>
          <a href={page.next.link}>{page.next.title}</a>
        {/if}
      </span>
    </div>
  </article>
  <OnThisPage {toc} />
</main>

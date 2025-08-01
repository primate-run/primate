<script>
  import Header from "./Header.svelte";
  import OnThisPage from "./OnThisPage.svelte";
  import Icon from "./Icon.svelte";

  export let content, toc, app, meta;

  const format = { "day": "2-digit", "month": "short", "year": "numeric" };
  const date = epoch => new Date(epoch).toLocaleDateString("en-AU", format);
  const { author, epoch, title } = meta;
</script>
<Header {app} {title} />
<main>
  <article class="blog">
  <h1>{title}</h1>
  <div class="blog-metadata">
    <Icon name="calendar" />
    {date(epoch)} by
    <a class="author" href="https://github.com/{author}">{author}</a>
  </div>
{@html content}
</article>
<OnThisPage {toc}/>
</main>

<script>
  import Header from "#component/Header";
  import Icon from "#component/Icon";
  import { date } from "#component/dateTime";

  export let html, meta;

  const { author, epoch, title } = meta;
</script>

<Header {title} />
<main class="blog">
  <article class="blog">
    <h1>{@html title.replace(/`([^`]+)`/g, "<code>$1</code>")}</h1>
    <div class="blog-metadata">
      <Icon name="calendar" />
      {date(epoch)} by
      <a class="author" href="https://github.com/{author}">{author}</a>
    </div>
    {@html html}
  </article>
</main>

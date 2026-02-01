<script>
  import Header from "#component/Header";
  import Icon from "#component/Icon";

  export let content, meta;

  const format = { day: "2-digit", month: "short", year: "numeric" };
  const date = (epoch) => new Date(epoch).toLocaleDateString("en-AU", format);
  const { author, epoch, title } = meta;
</script>

<Header {title} />
<main class="blog">
  <article class="blog">
    <h1>{title}</h1>
    <div class="blog-metadata">
      <Icon name="calendar" />
      {date(epoch)} by
      <a class="author" href="https://github.com/{author}">{author}</a>
    </div>
    {@html content}
  </article>
</main>

<script>
  import Header from "#component/Header";

  export let app, posts;

  function toExcerpt(post) {
    const end = post.html.indexOf("</p>");
    return post.html.slice(0, end + "</p>".length);
  }
  const format = { day: "2-digit", month: "short", year: "numeric" };
  const date = (epoch) => new Date(epoch).toLocaleDateString("en-AU", format);
  const iso = (epoch) => new Date(epoch).toISOString().slice(0, 10);
</script>

<Header {app} title="Blog" />

<main class="blog">
  <article class="blog-index">
    <h1 class="title">Blog</h1>

    <ul class="entries">
      {#each posts as post}
        <li class="entry">
          <a href={"/blog/" + post.href}>
            <h2 class="entry__title">{post.meta.title}</h2>

            <p class="entry__excerpt">{@html toExcerpt(post)}</p>

            <div class="entry__meta">
              <time datetime={iso(post.meta.epoch)}
                >{date(post.meta.epoch)}</time
              >
            </div>
          </a>
        </li>
      {/each}
    </ul>
  </article>
</main>

<style>
  /* Page shell */
  main.blog {
    padding-top: var(--height);
  }

  .blog .title {
    padding: 18px;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  /* Clean list with separators (no cards) */
  .entries {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .entry {
    padding: 18px;
    border-radius: 5px;
  }
  .entry:hover {
    background: var(--caption-bg);
  }

  .entry__title {
    margin: 0 0 0.45rem;
    line-height: 1.25;
    letter-spacing: -0.01em;
  }

  .entry__excerpt {
    margin: 0;
    color: var(--fg2);
    line-height: 1.6;
  }

  .entry__meta {
    margin-top: 5px;
    font-size: 14px;
    color: var(--fg1);
  }

  /* Small screens: keep it tidy */
  @media (max-width: 700px) {
    .entry {
      padding: 1.3rem 0 1.5rem;
    }
    .entry__excerpt {
      font-size: 1rem;
    }
  }
</style>

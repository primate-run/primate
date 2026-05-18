<script>
  import Header from "#component/Header";
  import { date } from "#component/dateTime";

  export let posts;

  const iso = (epoch) => new Date(epoch).toISOString().slice(0, 10);
</script>

<Header title="Blog" />

<main class="blog">
  <article class="blog-index">
    <h1 class="title">Blog</h1>

    <ul class="entries">
      {#each posts as post}
        <li class="entry">
          <a href={"/blog/" + post.href}>
            <h2 class="entry__title">
              {@html post.meta.title.replace(/`([^`]+)`/g, "<code>$1</code>")}
            </h2>

            <p class="entry__excerpt">{@html post.html_excerpt}</p>

            <div class="entry__meta">
              <time datetime={iso(post.meta.epoch)}>
                {date(post.meta.epoch)}
              </time>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  </article>
</main>

<style>
  main.blog {
    padding-top: var(--height);
  }

  .blog .title {
    padding: 0 18px;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  .entries {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .entry {
    padding: 18px;
    border-radius: 5px;
    list-style-type: none;
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

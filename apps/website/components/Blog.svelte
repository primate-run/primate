<script>
  import Header from "./Header.svelte";

  export let app, posts;

  const format = { "day": "2-digit", "month": "short", "year": "numeric" };
  const date = epoch => new Date(epoch).toLocaleDateString("en-AU", format);
</script>
<Header {app} title="Blog" />
<main>
<article>
  <h1>Blog</h1>
  {#each posts as post}
  <h2>
    <a href="/blog/{post.link}">{post.title}</a> {date(post.epoch)}
  </h2>
  {/each}
</article>
</main>

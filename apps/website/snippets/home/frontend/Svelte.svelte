<script>
  export let posts;
</script>

<h1>All posts</h1>
{#each posts as post}
  <h2>
    <a href="/post/{post.id}">
      {post.title}
    </a>
  </h2>
{/each}

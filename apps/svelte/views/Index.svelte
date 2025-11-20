<script lang="ts">
  import t from "#i18n";
  import Link from "components/Link.svelte";
  import type Post from "#component/Post";

  const {
    posts = [],
    title = "",
  }: {
    posts: Post[];
    title: string;
  } = $props();
  let count = $state(0);
</script>

<svelte:head>
  <title>Primate Svelte app</title>
  <meta name="keywords" content={title} />
</svelte:head>
<a href="/redirect">redirect</a>
<h1
  onclick={() => {
    console.log("clicked!");
  }}
>
  {$t("all_posts")}
</h1>
{#each posts as post}
  <Link {post} />
{/each}
<h3>{$t("counter")}</h3>
<div>
  <button
    onclick={() => {
      count = count - 1;
    }}>-</button
  >
  <button
    onclick={() => {
      count = count + 1;
    }}>+</button
  >
  {count}
</div>
<h3>{$t("switch_language")}</h3>
<button disabled={$t.loading} onclick={() => t.locale.set("en-US")}
  >{$t("english")}</button
>
<button disabled={$t.loading} onclick={() => t.locale.set("de-DE")}
  >{$t("german")}</button
>
<p>Current locale: {$t.locale.get()}</p>

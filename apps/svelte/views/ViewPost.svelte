<script lang="ts">
  import t from "#i18n";
  import type Post from "#component/Post";

  const { post }: { post: Post } = $props();
</script>

<h1>{$t("title")}: {post.title}</h1>

<div>Id: {post.id}</div>
<h3>{$t("switch_language")}</h3>
<button onclick={() => t.locale.set("en-US")}>{$t("english")}</button>
<button onclick={() => t.locale.set("de-DE")}>{$t("german")}</button>

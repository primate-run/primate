<script>
  import t from "#i18n";

  export let post;
</script>

<h1>{$t("title")}: {post.title}</h1>

<div>Id: {post.id}</div>
<button on:click={() => t.locale.set("en-US")}>{$t("english")}</button>
<button on:click={() => t.locale.set("de-DE")}>{$t("german")}</button>

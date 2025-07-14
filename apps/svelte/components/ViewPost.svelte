<script>
  import locale from "@primate/svelte/locale";
  import t from "@primate/svelte/i18n";

  export let post;
</script>
<h1>{$t("Title")}: {post.title}</h1>

<div>Id: {post.id}</div>
<h3>{$t("Switch language")}</h3>
<div><a on:click={() => locale.set("en-US")}>{$t("English")}</a></div>
<div><a on:click={() => locale.set("de-DE")}>{$t("German")}</a></div>

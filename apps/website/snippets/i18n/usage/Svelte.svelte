<script>
  import t from "@primate/svelte/i18n";
  import locale from "@primate/svelte/locale";
  let count = 3;
</script>

<svelte:head>
  <title>{$t("seo.title_home")}</title>
</svelte:head>

<h1>{$t("home.heading_all_posts")}</h1>
<p>{$t("home.greeting", { name: "Ada" })}</p>
<p>{$t("home.counter")}: {$t("home.counter_value", { count })}</p>
<p>{$t("home.items_count", { count })}</p>

<button on:click={() => locale.set("en-US")}>{$t("common.english")}</button>
<button on:click={() => locale.set("de-DE")}>{$t("common.german")}</button>

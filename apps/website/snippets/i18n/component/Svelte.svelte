<script>
  import t from "#i18n";

  export let count;
</script>

<h1>{$t("title")}</h1>
<p>{$t("greet_user", { name: "John" })}</p>
<p>{$t("counter", { count })}</p>
<button on:click={() => t.locale.set("en")}>{$t("english")}</button>
<button on:click={() => t.locale.set("de")}>{$t("german")}</button>

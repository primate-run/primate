<script>
  import t from "@primate/svelte/i18n";
  import locale from "@primate/svelte/locale";
</script>

<h1>{$t("All posts")}</h1>

<!-- switch language -->
<a on:click={() => locale.set("en-US")}>{$t("English")}</a>
<a on:click={() => locale.set("de-DE")}>{$t("German")}</a>

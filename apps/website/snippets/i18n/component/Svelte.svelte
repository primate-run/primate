<script>
  import t from "@/lib/i18n";

  const { count }: { count: number } = $props();
</script>

<h1>{$t("title")}</h1>
<p>{$t("greet_user", { name: "John" })}</p>
<p>{$t("counter", { count })}</p>
<button onclick={() => t.locale.set("en")}>{$t("english")}</button>
<button onclick={() => t.locale.set("de")}>{$t("german")}</button>

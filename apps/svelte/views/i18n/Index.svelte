<script lang="ts">
  import t from "#i18n";
</script>

<span id="locale">{t.locale.get()}</span>
<span id="title">{$t("title")}</span>
<button id="de" onclick={() => t.locale.set("de-DE")}>{$t("german")}</button>
<button id="en" onclick={() => t.locale.set("en-US")}>{$t("english")}</button>

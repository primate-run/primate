<script lang="ts">
  import t from "@/lib/i18n";
  const { children } = $props();
</script>

<span id="layout-locale">{$t.locale.get()}</span>
{@render children()}

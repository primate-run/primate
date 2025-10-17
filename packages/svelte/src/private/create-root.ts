export default (depth: number, i18n_active: boolean) => {
  const n = depth - 1;
  const body = Array.from({ length: n }, (_, i) => i - 1)
    .reduceRight((child, _, i) => `
      {#if p.views[${i + 1}]}
        <svelte:component this={p.views[${i}]} request={p.request} {...p.props[${i}]}>
          ${child}
        </svelte:component>
      {:else}
        <svelte:component this={p.views[${i}]} request={p.request} {...p.props[${i}]}/>
      {/if}
    `, `<svelte:component this={p.views[${n}]} request={p.request} {...p.props[${n}]}/>`);

  const i18nImports = i18n_active
    ? `
      import t from "#i18n";
      import sInternal from "primate/s/internal";
      import { onMount } from "svelte";`
    : "";

  const i18nInit = i18n_active
    ? `
      const server = p.request.context.i18n.locale;
      if (server !== undefined && server !== t.locale.get()) {
        t[sInternal].init(server);
      }

      // after hydration: in storage modes, flip to saved locale once
      onMount(() => { t[sInternal].restore(); });`
    : "";

  return `
    <script>
      import { afterUpdate, setContext } from "svelte";
      import context_name from "@primate/svelte/context-name";
      ${i18nImports}

      export let p;

      // expose full request context to children (unchanged)
      setContext(context_name, p.request.context);

      ${i18nInit}

      // let the platform hook push heads after updates (unchanged)
      afterUpdate(p.update);
    </script>

    ${body}
  `;
};

export default (depth: number, i18n_active: boolean) => {
  const n = depth - 1;
  const body = Array.from({ length: n }, (_, i) => i - 1)
    .reduceRight((child, _, i) => `
      {#if p.components[${i + 1}]}
        <svelte:component this={p.components[${i}]} request={p.request} {...p.props[${i}]}>
          ${child}
        </svelte:component>
      {:else}
        <svelte:component this={p.components[${i}]} request={p.request} {...p.props[${i}]}/>
      {/if}
    `, `<svelte:component this={p.components[${n}]} request={p.request} {...p.props[${n}]}/>`);

  const i18nImports = i18n_active
    ? `
      import t from "#i18n";
      import sInternal from "primate/s/internal";`
    : "";

  const i18nInit = i18n_active
    ? "t[sInternal].init(p.request.context.i18n.locale);"
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

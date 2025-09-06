export default (depth: number, i18n_active: boolean) => {
  const n = depth - 1;
  const body = Array.from({ length: n }, (_, i) => i - 1)
    .reduceRight((child, _, i) => `
      {#if components[${i + 1}]}
        <svelte:component this={components[${i}]} {request} {...props[${i}]}>
          ${child}
        </svelte:component>
      {:else}
        <svelte:component this={components[${i}]} {request} {...props[${i}]}/>
      {/if}
    `, `<svelte:component this={components[${n}]} {request} {...props[${n}]}/>`,
    );

  const i18nImports = i18n_active
    ? `
      import t from "#i18n";
      import sInternal from "primate/s/internal";`
    : "";

  const i18nInit = i18n_active
    ? "t[sInternal].init(request.context.i18n.locale);"
    : "";

  return `
    <script>
      import { afterUpdate, setContext } from "poly";
      import context_name from "@primate/poly/context-name";
      ${i18nImports}

      export let components;
      export let props;
      export let request;
      export let update = () => undefined;

      setContext(context_name, request.context);

      ${i18nInit}

      afterUpdate(() => update());
    </script>
    ${body}
  `;
};

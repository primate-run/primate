export default (depth: number) => {
  const n = depth;
  const body = Array.from({ length: n }, (_, i) => i - 1)
    .reduceRight((child, _, i) => `
      {#if p.views[${i + 1}] !== undefined}
        <svelte:component this={p.views[${i}]} {...p.props[${i}]}>
          ${child}
        </svelte:component>
      {:else}
        <svelte:component this={p.views[${i}]} {...p.props[${i}]}/>
      {/if}
    `, `<svelte:component this={p.views[${n}]} {...p.props[${n}]}/>`);

  return `
    <script>
      import { afterUpdate, setContext } from "svelte";
      import context_name from "@primate/svelte/context-name";
      import { request } from "@primate/svelte/app";

      export let p;

      setContext(context_name, p.context);

      function sync(next) {
        const { context, path, ...public_request } = next.request;
        request.set(public_request);
      }

      sync(p);

      afterUpdate(() => { sync(p); });
    </script>

    ${body}
  `;
};

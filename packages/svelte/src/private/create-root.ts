export default (depth: number) => {
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

  return `
    <script>
      import { afterUpdate, setContext } from "svelte";
      import context_name from "@primate/svelte/context-name";

      export let p;

      setContext(context_name, p.request.context);

      afterUpdate(p.update);
    </script>
    ${body}
  `;
};

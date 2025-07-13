export default (depth: number) => {
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

  return `
    <script>
      import { afterUpdate, setContext } from "poly";
      import context_name from "@primate/poly/context-name";

      export let components;
      export let props;
      export let request;
      export let update = () => undefined;

      console.log("components", components);
      console.log("props", props);
      console.log("request", request);
      console.log("update", update);
      setContext(context_name, request.context);

      afterUpdate(update);
    </script>
    ${body}
  `;
};

export default (length: number) => {
  const n = length - 1;
  const body = Array.from({ length: n }, (_, i) => i - 1)
    .reduceRight((child, _, i) => `components[${i + 1}] !== undefined
        ? createComponent(components[${i}], {request, ...props[${i}], 
            children: ${child}})
        : createComponent(components[${i}], {request, ...props[${i}]})
    `, `createComponent(components[${n}], {request, ...props[${n}]})`);

  return `
    import { createSignal } from "solid-js";
    import { createComponent } from "solid-js/web";
    import AppContext from "@primate/solid/context/app";
    import HeadContext from "@primate/solid/context/head";

    export default ({
      components,
      props,
      request,
      push_heads: value,
    }) => {
      const [context, setContext] = createSignal(request.context);
      const $value = { context, setContext };

      return <AppContext.Provider value={$value}>
          <HeadContext.Provider value={value}>
            {${body}}
          </HeadContext.Provider>
        </AppContext.Provider>
    }
  `;
};

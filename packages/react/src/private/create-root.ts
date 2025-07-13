export default (length: number) => {
  const n = length - 1;
  const body = Array.from({ length: n }, (_, i) => i - 1)
    .reduceRight((child, _, i) => `components[${i + 1}] !== undefined
        ? createElement(components[${i}], {request, ...props[${i}]}, ${child})
        : createElement(components[${i}], {request, ...props[${i}]})
    `, `createElement(components[${n}], {request, ...props[${n}]})`);

  return `
    import { createElement, useState } from "react";
    import AppContext from "@primate/react/context/app";
    import HeadContext from "@primate/react/context/head";
    import platform from "@primate/react/platform";

    export default ({
      components,
      props,
      request,
      push_heads: value,
    }) => {
      const [context, setContext] = useState(request.context);
      const $value = { context, setContext };
      return platform === "browser"
        ? createElement(AppContext.Provider, { value: $value }, ${body})
        : createElement(AppContext.Provider, { value: $value },
            createElement(HeadContext.Provider, { value }, ${body}))
      ;
    }
  `;
};

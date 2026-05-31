export default (length: number) => {
  const n = length;
  const body = Array.from({ length: n }, (_, i) => i - 1)
    .reduceRight((child, _, i) => `views[${i + 1}] !== undefined
        ? createElement(views[${i}], props[${i}], ${child})
        : createElement(views[${i}], props[${i}])
    `, `createElement(views[${n}], props[${n}])`);

  return `
    import { createElement } from "react";
    import HeadContext from "@primate/react/context/head";
    import platform from "@primate/react/platform";
    import { useRequest } from "@primate/react/app";

    export default ({ views, props, request, push_heads: value }) => {
      useRequest.set(request);

      const tree = ${body};

      return platform === "browser"
        ? tree
        : createElement(HeadContext.Provider, { value }, tree)
      ;
    }
  `;
};

export default (length: number) => {
  const n = length;
  const body = Array.from({ length: n }, (_, i) => i - 1).reduceRight(
    (child, _, i) => `views[${i + 1}] !== undefined
      ? createComponent(views[${i}], { ...props[${i}],
          get children() { return ${child}; }
        })
      : createComponent(views[${i}], props[${i}])
    `,
    `createComponent(views[${n}], props[${n}])`,
  );

  return `
    import { createComponent } from "solid-js/web";
    import { setRequest } from "@primate/solid/app";
    import HeadContext from "@primate/solid/context/head";

    export default ({ views, props, request, push_heads: value }) => {
      setRequest(request);

      return <HeadContext.Provider value={value}>
        {${body}}
      </HeadContext.Provider>
    }
  `;
};

export default (length: number, i18n_active: boolean) => {
  const n = length - 1;
  const body = Array.from({ length: n }, (_, i) => i - 1)
    .reduceRight((child, _, i) => `views[${i + 1}] !== undefined
        ? createComponent(views[${i}], {request, ...props[${i}],
            children: ${child}})
        : createComponent(views[${i}], {request, ...props[${i}]})
    `, `createComponent(views[${n}], {request, ...props[${n}]})`);

  const i18n_imports = i18n_active
    ? `
      import I18nBridge from "@primate/solid/i18n/Bridge";
      import t from "#i18n";`
    : "";

  const tree = i18n_active
    ? `<I18nBridge t={t}>{${body}}</I18nBridge>`
    : `{${body}}`;

  return `
    import { createSignal } from "solid-js";
    import { createComponent } from "solid-js/web";
    import AppContext from "@primate/solid/context/app";
    import HeadContext from "@primate/solid/context/head";${i18n_imports}

    export default ({ views, props, request, push_heads: value }) => {
      const [context, setContext] = createSignal(request.context);
      const $value = { context, setContext };

      return <AppContext.Provider value={$value}>
          <HeadContext.Provider value={value}>
            ${tree}
          </HeadContext.Provider>
        </AppContext.Provider>
    }
  `;
};

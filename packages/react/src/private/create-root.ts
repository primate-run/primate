export default (length: number, i18n_active: boolean) => {
  const n = length - 1;
  const body = Array.from({ length: n }, (_, i) => i - 1)
    .reduceRight((child, _, i) => `views[${i + 1}] !== undefined
        ? createElement(views[${i}], {request, ...props[${i}]}, ${child})
        : createElement(views[${i}], {request, ...props[${i}]})
    `, `createElement(views[${n}], {request, ...props[${n}]})`);

  const i18n_imports = i18n_active
    ? `
      import I18nBridge from "@primate/react/i18n/Bridge";
      import t from "#i18n";`
    : "";

  const tree = i18n_active
    ? `createElement(I18nBridge, { t }, ${body})`
    : body;

  return `
    import { createElement, useState } from "react";
    import AppContext from "@primate/react/context/app";
    import HeadContext from "@primate/react/context/head";
    import platform from "@primate/react/platform";${i18n_imports}

    export default ({ views, props, request, push_heads: value }) => {
      const [context, setContext] = useState(request.context);
      const $value = { context, setContext };
      const tree = ${tree};

      return platform === "browser"
        ? createElement(AppContext.Provider, { value: $value }, tree)
        : createElement(AppContext.Provider, { value: $value },
            createElement(HeadContext.Provider, { value }, tree))
      ;
    }
  `;
};

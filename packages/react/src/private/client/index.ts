import spa from "#client/spa";
import type ClientOptions from "@primate/core/frontend/ClientOptions";
import type ClientRoot from "@primate/core/frontend/ClientRoot";

export default (root: ClientRoot, options: ClientOptions) => `
  import * as components from "app";
  import { make_root, createElement, ReactHead } from "app";

  const { body } = globalThis.window.document;

  ReactHead.clear();
  const root = make_root.${options.ssr ? "ssr" : "csr"}(body,
    createElement(components.root_react, {
      components: [${root.names.map(name => `components.${name}`).join(", ")}],
      data: ${JSON.stringify(root.data)},
      request: {
        ...${JSON.stringify(root.request)},
        url: new URL(location.href),
      },
    })
  );
  ${options.spa ? spa : ""}`;

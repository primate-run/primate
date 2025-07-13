import spa from "#client/spa";
import type ClientOptions from "@primate/core/frontend/ClientOptions";
import type ClientRoot from "@primate/core/frontend/ClientRoot";

export default (root: ClientRoot, options: ClientOptions) => `
  import * as components from "app";
  import { hydrate, mount } from "app";

  const root = ${options.ssr ? "hydrate" : "mount"}(components.root_svelte, {
    target: document.body,
    props: {
      p: {
        components: [${root.names.map(name => `components.${name}`).join(", ")}],
        data: ${JSON.stringify(root.data)},
        request: {
          ...${JSON.stringify(root.request)},
          url: new URL(location.href),
        },
        update: () => undefined,
      },
    },
  });
  ${options.spa ? spa : ""}`;

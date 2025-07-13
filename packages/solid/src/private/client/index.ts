import spa from "#client/spa";
import type ClientOptions from "@primate/core/frontend/ClientOptions";
import type ClientRoot from "@primate/core/frontend/ClientRoot";
import { generateHydrationScript } from "solid-js/web";

const hydration_script = generateHydrationScript()
  .match(/^<script>(?<code>.*?)<\/script>/u)?.groups?.code ?? "";

export default (root: ClientRoot, options: ClientOptions) => `
  import * as components from "app";
  import { hydrate_solid, render_solid, SolidHead } from "app";

  window._$HY = { events: [], completed: new WeakSet(), r: {} };

  ${hydration_script}

  SolidHead.clear();
  let dispose = hydrate_solid(() => components.root_solid({
      components: [${root.names.map(name => `components.${name}`).join(", ")}],
      data: ${JSON.stringify(root.data)},
      request: {
        ...${JSON.stringify(root.request)},
        url: new URL(location.href),
      },
    }), globalThis.window.document.body);
  ${options.spa ? spa : ""}`;

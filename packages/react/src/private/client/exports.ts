export default `
  import React from "react";
  import { hydrateRoot, createRoot } from "react-dom/client";
  const { createElement } = React;
  export { createElement };
  export { default as ReactHead } from "@primate/react/Head";

  const make_root = {
    ssr: (dom_node, react_node) => hydrateRoot(dom_node, react_node),
    csr: (dom_node, react_node) => {
      const root = createRoot(dom_node);
      root.render(react_node);
      return root;
    },
  };

  export { make_root };
`;

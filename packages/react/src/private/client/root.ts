import type Data from "#client/Data";
import type { Dict } from "@rcompat/type";
import type { ComponentType, ReactNode } from "react";
import type { Container, Root } from "react-dom/client";
import { createRoot, hydrateRoot } from "react-dom/client";
import * as Views from "react:views";

export type RootProps = {
  views: ComponentType<any>[];
  props: Dict[];
  request: Data["request"] & {
    url: URL;
  };
};

function toProps(data: Data): RootProps {
  return {
    views: data.views.map(name => Views[name]),
    props: data.props,
    request: {
      ...data.request,
      url: new URL(data.request.url),
    },
  };
}

function csr(container: Container, child: ReactNode): Root {
  const root = createRoot(container);
  root.render(child);
  return root;
}

function ssr(container: Element | Document, child: ReactNode): Root {
  return hydrateRoot(container, child);
}

const root = {
  toProps,
  csr,
  ssr,
};

export default root;

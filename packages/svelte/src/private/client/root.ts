import type Data from "#client/Data";
import type { Dict } from "@rcompat/type";
import type { Component } from "svelte";
import { hydrate, mount } from "svelte";
import * as views from "svelte:views";

export type RootProps = {
  views: Component<any>[];
  props: Dict[];
  request: Data["request"] & {
    url: URL;
  };
  update?: () => void;
};

function toProps(data: Data) {
  return {
    views: data.views.map(name => views[name]),
    props: data.props,
    request: {
      ...data.request,
      url: new URL(data.request.url),
    },
    update: () => undefined,
  };
}

const root = {
  toProps,
  ssr: hydrate,
  csr: mount,
};

export default root;

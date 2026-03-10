import type Data from "#client/Data";
import type { Dict } from "@rcompat/type";
import { type Component } from "solid-js";
import { hydrate, render } from "solid-js/web";
import * as Views from "solid:views";

type ViewComponent = Component<any>;

export type RootProps = {
  views: ViewComponent[];
  props: Dict[];
  request: Data["request"] & {
    url: URL;
  };
  update?: () => void;
};

function toProps(data: Data, update?: () => void): RootProps {
  return {
    views: data.views.map(name => Views[name]),
    props: data.props,
    request: {
      ...data.request,
      url: new URL(data.request.url),
    },
    update,
  };
}

const root = {
  toProps,
  csr: render,
  ssr: hydrate,
};

export default root;

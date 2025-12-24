import type ClientData from "@primate/core/client/Data";
import spa from "@primate/core/client/spa";
import SolidHead from "@primate/solid/Head";
import type { Dict } from "@rcompat/type";
import { hydrate, render } from "solid-js/web";
import root_view from "solid:root";
import * as views from "solid:views";

// @ts-expect-error solid hydration
globalThis._$HY = { completed: new WeakSet(), events: [], r: {} };

const { body } = globalThis.window.document;
SolidHead.clear();

type Data = ClientData<{
  views: string[];
  props: Dict[];
}>;

const make_props = (data: ClientData<Data>) => ({
  views: data.views.map(name => views[name]),
  props: data.props,
  request: {
    ...data.request,
    url: new URL(location.href),
  },
});

export default class Solid {
  static mount(_view: string, data: ClientData<Data>) {
    let dispose = hydrate(() => root_view(make_props(data)), body);

    if (data.spa) {
      window.addEventListener("DOMContentLoaded", _ => spa<Data>(_data => {
        dispose();
        dispose = render(() => root_view(make_props(_data)), body);
      }));
    }
  }
}

import type { Dict } from "@rcompat/type";

import * as views from "webc:views";

type Props = {
  props: Dict;
};

export default class WebComponentsApp {
  static mount(view: string, props: Props) {
    globalThis.document.body.appendChild(new views[view](props.props));
  }
}

import type Dict from "@rcompat/type/Dict";

import * as views from "webc:views";

type Props = {
  props: Dict;
};

export default class WebComponentsClient {
  static mount(view: string, props: Props) {
    globalThis.document.body.appendChild(new views[view](props.props));
  }
}

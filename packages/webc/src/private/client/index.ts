import type Dict from "@rcompat/type/Dict";

// @ts-expect-error esbuild vfs
import * as components from "webc:components";

export default class WebComponentsClient {
  static mount(component: string, props: Dict) {
    globalThis.document.body
      .appendChild(new components[component](props.props));
  }
}

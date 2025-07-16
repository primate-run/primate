import type Dict from "@rcompat/type/Dict";

const to_hyphen = (x: string) => x.replaceAll("/", "-");

//import * as components from "webc:components";

export default class WebComponentsClient {
  static mount(component: string, props: Dict) {
    globalThis.customElements.define("p-wrap-with", class extends HTMLElement {
      connectedCallback() {
        this.attachShadow({ mode: "open" });

        const id = this.getAttribute("id");
        const wrapped = globalThis.registry[id];
        this.shadowRoot!.appendChild(wrapped);
        wrapped.render();
        delete globalThis.registry[id];
      }
    });
    globalThis.registry = {};

    const element = globalThis.document.createElement(to_hyphen(component));
    // @ts-expect-error esbuild DOM
    element.props = props;
    globalThis.document.body.appendChild(element);
  }
}

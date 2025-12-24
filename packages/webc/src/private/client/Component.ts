import type { Dict } from "@rcompat/type";

export default class Component extends HTMLElement {
  #props: Dict;
  #component?: string;
  static tag: string = "";

  constructor(props?: Dict) {
    super();

    this.#props = props === undefined
      // <sub-component name="bob" />
      ? Object.fromEntries(this.getAttributeNames().map(key =>
        [key, this.getAttribute(key)]))
      // new SubComponent({ name: "bob" }).render()
      : props;
  }

  get props() {
    return this.#props;
  }

  set props(props: Dict) {
    this.#props = props;
  }

  connectedCallback() {
    this.attachShadow({ mode: "open" });

    const root = this.shadowRoot;

    if (root === null) {
      return;
    }

    root.innerHTML = this.render(this.props);
    this.mounted(root);
  }

  render(props: Dict): string {
    return "";
  }

  mounted(_: ShadowRoot) {
    // noop
  }

  toString() {
    return this.render(this.props);
  }
}

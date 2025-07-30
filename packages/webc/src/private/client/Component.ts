import type Dict from "@rcompat/type/Dict";

export default abstract class Component extends HTMLElement {
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

  abstract render(props: Dict): string;

  mounted(_: ShadowRoot) {
    // noop
  }

  toString() {
    return this.render(this.props);
  }
}

import type Props from "@primate/core/frontend/Props";

export default abstract class Component extends HTMLElement {
  #props: Props;

  constructor(props?: Props) {
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

  set props(props: Props) {
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

  abstract render(props: Props): string;

  mounted(_: ShadowRoot) {
    // noop
  }

  toString() {
    const uuid = crypto.randomUUID();
    globalThis.registry[uuid] = this;
    return `<p-wrap-with id="${uuid}"></p-wrap-with>`;
  }
}

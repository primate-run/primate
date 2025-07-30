import type Dict from "@rcompat/type/Dict";

export default class Component {
  render(_props: Dict) {
    return "";
  }

  mounted(_: ShadowRoot) {
    // noop
  }
}

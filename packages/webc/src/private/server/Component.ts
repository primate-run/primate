import type { Dict } from "@rcompat/type";

export default class Component {
  render(_props: Dict) {
    return "";
  }

  mounted(_: ShadowRoot) {
    // noop
  }
}

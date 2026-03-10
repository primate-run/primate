import type { Init } from "@primate/core/frontend";
import type { FileRef } from "@rcompat/fs";

const module: Init = {
  name: "webc",
  extensions: [".webc"],
  layouts: false,
  client: true,
  render(_view, _props) {
    return { body: "", head: "" };
  },
};

export default module;

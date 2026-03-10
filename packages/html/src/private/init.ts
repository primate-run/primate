import transform from "#transform";
import type { Init } from "@primate/core/frontend";

const init: Init = {
  name: "html",
  extensions: [".html"],
  layouts: false,
  client: false,
  transform,
};

export default init;

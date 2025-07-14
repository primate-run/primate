import Module from "@primate/core/frontend/Module";

export default class Runtime extends Module {
  name = "eta";
  defaultExtension = ".eta";
  layouts = false;
  client = false;
}

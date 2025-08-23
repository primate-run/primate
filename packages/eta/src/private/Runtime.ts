import FrontendModule from "@primate/core/frontend/Module";

export default class Runtime extends FrontendModule {
  name = "eta";
  defaultExtensions = [".eta"];
  layouts = false;
  client = false;
}

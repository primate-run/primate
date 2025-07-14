import handler from "#handler";
import type Frontend from "@primate/core/Frontend";
import FrontendModule from "@primate/core/frontend/Module";

export default class Runtime extends FrontendModule {
  name = "html";
  defaultExtension = ".html";
  layouts = false;
  client = false;
  handler: Frontend = handler(this);
}

import response from "#response";
import type { ViewResponse } from "@primate/core/frontend";
import FrontendModule from "@primate/core/frontend/Module";

export default class Runtime extends FrontendModule {
  name = "html";
  defaultExtensions = [".html"];
  layouts = false;
  client = false;
  respond: ViewResponse = response(this);
}

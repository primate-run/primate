import response from "#response";
import FrontendModule from "@primate/core/frontend/Module";
import type ViewResponse from "@primate/core/frontend/ViewResponse";

export default class Runtime extends FrontendModule {
  name = "html";
  defaultExtensions = [".html"];
  layouts = false;
  client = false;
  respond: ViewResponse = response(this);
}

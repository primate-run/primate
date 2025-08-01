import type Frontend from "@primate/core/frontend";
import FrontendModule from "@primate/core/frontend/Module";
import inline from "@primate/core/inline";
import handler from "@primate/html/handler";

export default class Runtime extends FrontendModule {
  name = "htmx";
  defaultExtension = ".htmx";
  layouts = false;
  client = false;
  handler: Frontend = (name, props, options = {}) => async (app, _, request) =>
  {
    const code = "import { htmx } from \"app\";";
    const { head, integrity } = await inline(code, "module");
    const script_src = [integrity];

    return handler(this)(name, props, { csp: { script_src },
      head,
      partial: Boolean(request.headers["hx-request"]),
      ...options,
    })(app, _, request);
  };
}

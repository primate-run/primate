import borrow from "#borrow";
import type ResponseFunction from "@primate/core/response/ResponseFunction";
import session from "primate/config/session";
import error from "primate/response/error";
import redirect from "primate/response/redirect";
import view from "primate/response/view";
import type { PyProxy } from "pyodide/ffi";

type View = typeof view;
type ViewParams = Parameters<View>;
type RedirectParams = Parameters<typeof redirect>;
type ViewReturn = ReturnType<View>;

export default {
  error(options: PyProxy): ResponseFunction {
    return error(borrow(options));
  },
  redirect(location: RedirectParams[0], status: RedirectParams[1]): ResponseFunction {
    return redirect(location, status);
  },
  session: {
    get id() {
      return session().id;
    },
    get exists() {
      return session().exists;
    },
    create(initial: PyProxy) {
      session().create(borrow(initial));
    },
    get() {
      return session().get();
    },
    try() {
      return session().get();
    },
    set(data: PyProxy) {
      session().set(borrow(data));
    },
    destroy() {
      session().destroy();
    },
  },
  view(name: ViewParams[0], props?: PyProxy, options?: PyProxy): ViewReturn {
    return view(name, borrow(props), borrow(options));
  },
};

import HANDLER_PROPERTY from "#handler-property";
import unwrap from "#unwrap";
import type { ResponseFunction, ResponseLike } from "@primate/core";
import response from "@primate/core/response";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";
import type { PyProxy } from "pyodide/ffi";

const { error, redirect, view } = response;

const handlers = { error, redirect, view };
type Handler = keyof typeof handlers;

type ViewParameters = Parameters<typeof view>;
type RedirectParameters = Parameters<typeof redirect>;
type ErrorParameters = Parameters<typeof error>;

const handle_handler = (handler: Handler, args: Dict) => {
  if (handler === "view") {
    const { name, options, props } = args as {
      name: ViewParameters[0];
      options: ViewParameters[2];
      props: ViewParameters[1];
    };
    return view(name, props, options);
  }
  if (handler === "redirect") {
    const { location, status } = args as {
      location: RedirectParameters[0];
      status: RedirectParameters[1];
    };
    return redirect(location, status);
  }

  const { options } = args as {
    options: ErrorParameters[0];
  };
  return error(options);
};

function is_handler(x: unknown): x is Handler {
  return is.string(x) && Object.keys(handlers).includes(x);
}

function to_response(args: Dict | PyProxy | undefined): ResponseLike {
  if (is.undefined(args)) return null;
  const unwrapped = unwrap(args as PyProxy);

  const handler = unwrapped[HANDLER_PROPERTY];

  return is_handler(handler)
    ? handle_handler(handler, unwrapped) as ResponseFunction
    : unwrapped;
};

export default to_response;

import HANDLER_PROPERTY from "#handler-property";
import type ResponseFunction from "@primate/core/response//ResponseFunction";
import error from "@primate/core/response/error";
import redirect from "@primate/core/response/redirect";
import type ResponseLike from "@primate/core/response/ResponseLike";
import view from "@primate/core/response/view";
import type Dict from "@rcompat/type/Dict";

const handlers = { error, redirect, view };
type Handler = keyof typeof handlers;

type ViewParameters = Parameters<typeof view>;
type RedirectParameters = Parameters<typeof redirect>;
type ErrorParameters = Parameters<typeof error>;

const handle_handler = (handler: Handler, response: Dict) => {
  if (handler === "view") {
    const { name, options, props } = response as {
      name: ViewParameters[0];
      options: ViewParameters[2];
      props: ViewParameters[1];
    };
    return view(name, props, options);
  }
  if (handler === "redirect") {
    const { location, status } = response as {
      location: RedirectParameters[0];
      status: RedirectParameters[1];
    };
    return redirect(location, status);
  }

  const { options } = response as {
    options: ErrorParameters[0];
  };
  return error(options);
};

const is_handler = (handler: unknown): handler is Handler =>
  typeof handler === "string" && Object.keys(handlers).includes(handler);

export default (response: Dict): ResponseLike => {
  const handler = response[HANDLER_PROPERTY];

  return is_handler(handler)
    ? handle_handler(handler, response) as ResponseFunction
    : response;
};

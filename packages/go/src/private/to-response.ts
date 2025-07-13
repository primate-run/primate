import error from "@primate/core/handler/error";
import redirect from "@primate/core/handler/redirect";
import view from "@primate/core/handler/view";
import type ResponseFunction from "@primate/core/ResponseFunction";
import type ResponseLike from "@primate/core/ResponseLike";
import type Dictionary from "@rcompat/type/Dictionary";

type Handler = "view" | "redirect" | "error";

const parse = (input: string | null) =>
  input === null ? undefined : JSON.parse(input);

const handle_handler = (handler: Handler, response: Dictionary) => {
  if (handler === "view") {
    const { component, props, options } = response as {
      component: string;
      props: string | null;
      options: string | null;
    };
    return view(component, parse(props), parse(options));
  }
  if (handler === "redirect") {
    const { location, status } = response as {
      location: string;
      // unchecked, go is int
      status: Parameters<typeof redirect>[1] | null;
    };
    return redirect(location, status === null ? undefined : status);
  }

  const { options } = response as {
    options: string | null;
  };
  return error(parse(options));
};

type ResponseType = (() => { handler: Handler } & Dictionary) | string;

export default (response: ResponseType): ResponseLike => {
  if (typeof response === "function") {
    const { handler, ...args } = response();
    return handle_handler(handler as Handler, args) as ResponseFunction;
  }
  return JSON.parse(response);
};

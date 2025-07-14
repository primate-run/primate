import type { PyProxy } from "pyodide/ffi";
import type Dictionary from "@rcompat/type/Dictionary";

type DictConverter = Iterable<[
  key: string,
  value: unknown,
]>;

const dict_converter = (value: DictConverter) => Object.fromEntries(value);

const normalize = (response: Map<string, unknown> | Dictionary) =>
  response instanceof Map ? Object.fromEntries(response.entries()) : response;

const recursively_convert = (input: Dictionary) => {
  return Object.fromEntries(Object.entries(input).map(([k, o]) => {
    if ((o as Dictionary).toJs !== undefined) {
      return [k, (o as PyProxy).toJs({ dict_converter })];
    }
    return [k, o];
  }));
};

const qualify = (response: PyProxy, destroy = true) => {
  if ((response.toJs as any) !== undefined) {
    const py_proxy = response;
    const converted = py_proxy.toJs({ dict_converter });
    destroy && py_proxy.destroy();
    return converted;
  }

  if (typeof response === "object") {
    return recursively_convert(response);
  }
  return response;
};

export const unwrap = (response: PyProxy) => normalize(qualify(response));

export const unwrap_async = (response: PyProxy) =>
  normalize(qualify(response, false));

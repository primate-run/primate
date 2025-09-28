import binary from "@primate/core/response/binary";
import error from "@primate/core/response/error";
import json from "@primate/core/response/json";
import redirect from "@primate/core/response/redirect";
import sse from "@primate/core/response/sse";
import text from "@primate/core/response/text";
import view from "@primate/core/response/view";
import ws from "@primate/core/response/ws";

export type {
  default as ViewResponse
} from "@primate/core/frontend/ViewResponse";
export type {
  default as ResponseFunction
} from "@primate/core/response/ResponseFunction";
export type { default as ServeApp } from "@primate/core/ServeApp";

export default {
  binary,
  error,
  json,
  redirect,
  sse,
  text,
  view,
  ws,
};

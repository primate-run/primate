import binary from "@primate/core/response/binary";
import error from "@primate/core/response/error";
import json from "@primate/core/response/json";
import redirect from "@primate/core/response/redirect";
import sse from "@primate/core/response/sse";
import text from "@primate/core/response/text";
import view from "@primate/core/response/view";
import ws from "@primate/core/response/ws";

export default Object.assign(Object.create(null), {
  binary,
  error,
  json,
  redirect,
  sse,
  text,
  view,
  ws,
});

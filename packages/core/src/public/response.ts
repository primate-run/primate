import binary from "#response/binary";
import error from "#response/error";
import json from "#response/json";
import redirect from "#response/redirect";
import sse from "#response/sse";
import text from "#response/text";
import view from "#response/view";
import ws from "#response/ws";
import $null from "#response/null";

const response = {
  binary,
  error,
  json,
  redirect,
  sse,
  text,
  view,
  ws,
  null: $null,
};

export default response;
